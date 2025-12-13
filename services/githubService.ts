import { GitHubTreeItem, GitHubCommit, Repository, GitHubProfile, DependabotAlert, ReadmeGenerationContext } from '../types';
import { Octokit } from 'octokit';
import { setCache, getCache } from '../utils/cacheUtils';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_PAT_LOCAL_STORAGE_KEY = 'sentinel-github-pat';

class GitHubApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = 'GitHubApiError';
    }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let lastApiCallTimestamp = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between calls

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, initialDelay = 1000): Promise<Response> {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTimestamp;

    if (timeSinceLastCall < MIN_REQUEST_INTERVAL) {
        const delay = MIN_REQUEST_INTERVAL - timeSinceLastCall;
        console.log(`Rate limiting GitHub API: delaying next call by ${delay}ms.`);
        await sleep(delay);
    }

    lastApiCallTimestamp = Date.now();

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(url, options);
            if ((response.status === 403 || response.status >= 500) && attempt < retries - 1) {
                const baseDelay = initialDelay * Math.pow(2, attempt);
                const jitter = Math.floor(Math.random() * 500);
                const delay = baseDelay + jitter;
                console.warn(`GitHub API request to ${url} failed with status ${response.status}. Retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }
            return response;
        } catch (error) {
            if (attempt < retries - 1) {
                const baseDelay = initialDelay * Math.pow(2, attempt);
                const jitter = Math.floor(Math.random() * 500);
                const delay = baseDelay + jitter;
                console.warn(`GitHub API request to ${url} failed with a network error. Retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            } else {
                throw error;
            }
        }
    }
    throw new Error('Exceeded max retries for GitHub API request.');
}


const getHeaders = () => {
    const token = localStorage.getItem(GITHUB_PAT_LOCAL_STORAGE_KEY);
    if (!token) {
        throw new GitHubApiError("GitHub Personal Access Token not found. Please set it in Settings.", 401);
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
    };
};

const getOctokit = () => {
    const token = localStorage.getItem(GITHUB_PAT_LOCAL_STORAGE_KEY);
    if (!token) {
        throw new GitHubApiError("GitHub Personal Access Token not found. Please set it in Settings.", 401);
    }
    return new Octokit({ auth: token });
};

const handleApiError = async (response: Response, url: string, context: string): Promise<never> => {
    const errorBody = await response.text();
    console.error(`GitHub API Error (${context}): Status: ${response.status}. URL: ${url}. Body: ${errorBody}`);

    if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth-error'));
        throw new GitHubApiError("Authentication failed (401). Your token is invalid, expired, or lacks the required 'repo', 'read:user', and 'security_events' scopes.", 401);
    }
    if (response.status === 403) {
        throw new GitHubApiError("Permission denied or API rate limit exceeded (403).", 403);
    }
    if (response.status === 404) {
        throw new GitHubApiError("Resource not found (404). Please check the repository URL.", 404);
    }

    try {
        const errorJson = JSON.parse(errorBody);
        if (errorJson.message) {
            throw new GitHubApiError(errorJson.message, response.status);
        }
    } catch (e) { }

    throw new GitHubApiError(`An unexpected error occurred during ${context}. Status: ${response.status}`, response.status);
};

export const getAuthenticatedUserProfile = async (): Promise<GitHubProfile> => {
    const url = `${GITHUB_API_URL}/user`;
    try {
        const response = await fetchWithRetry(url, { headers: getHeaders() });
        if (!response.ok) {
            return await handleApiError(response, url, 'fetching authenticated user profile');
        }
        return response.json();
    } catch (error) {
        if (error instanceof GitHubApiError) throw error;
        throw new Error("Network error while trying to connect to GitHub.");
    }
}

export const parseGitHubUrl = (url: string): { owner: string; repo: string, pull?: string } | null => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname !== 'github.com') return null;
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2) return null;
        const pullMatch = urlObj.pathname.match(/\/pull\/(\d+)/);
        return {
            owner: pathParts[0],
            repo: pathParts[1].replace('.git', ''),
            pull: pullMatch ? pullMatch[1] : undefined,
        };
    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
};

export const getRepoFileTree = async (owner: string, repo: string): Promise<GitHubTreeItem[]> => {
    const cacheKey = `github-tree-${owner}-${repo}`;
    const cachedTree = getCache<GitHubTreeItem[]>(cacheKey);
    if (cachedTree) {
        return cachedTree;
    }

    const repoInfoUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}`;
    const repoInfoResponse = await fetchWithRetry(repoInfoUrl, {
        headers: getHeaders(),
    });

    if (!repoInfoResponse.ok) {
        return handleApiError(repoInfoResponse, repoInfoUrl, 'fetching repo info');
    }

    const repoData = await repoInfoResponse.json();
    const defaultBranch = repoData.default_branch;

    const treeUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const response = await fetchWithRetry(treeUrl, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        return handleApiError(response, treeUrl, 'fetching file tree');
    }

    const data = await response.json();
    const scannableFiles = data.tree.filter((item: GitHubTreeItem) =>
        item.type === 'blob' &&
        item.size && item.size < 100000 &&
        /\.(py|ts|tsx|js|jsx|tf|hcl|json|lock|md|txt|cfg|ini|toml|yaml|yml)$/i.test(item.path)
    );

    setCache(cacheKey, scannableFiles, 60 * 60 * 1000); // 1-hour TTL
    return scannableFiles;
};


export const getFileContent = async (owner: string, repo: string, path: string): Promise<string> => {
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`;
    const response = await fetchWithRetry(url, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        return handleApiError(response, url, `fetching file content for ${path}`);
    }

    const data = await response.json();
    if (data.encoding !== 'base64') {
        throw new Error(`Unsupported file encoding: ${data.encoding}`);
    }
    return atob(data.content);
};

export const getRepoCommits = async (owner: string, repo: string, per_page: number = 30): Promise<GitHubCommit[]> => {
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/commits?per_page=${per_page}`;
    const response = await fetchWithRetry(url, { headers: getHeaders() });
    if (!response.ok) {
        return handleApiError(response, url, 'fetching commits');
    }
    return response.json();
};

export const getCommitDiff = async (owner: string, repo: string, sha: string): Promise<string> => {
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/commits/${sha}`;
    const response = await fetchWithRetry(url, {
        headers: { ...getHeaders(), 'Accept': 'application/vnd.github.v3.diff' }
    });
    if (!response.ok) {
        return handleApiError(response, url, 'fetching commit diff');
    }
    return response.text();
};


export const getUserRepos = async (page: number = 1): Promise<Repository[]> => {
    const url = `${GITHUB_API_URL}/user/repos?type=all&sort=updated&per_page=100&page=${page}`;
    const response = await fetchWithRetry(url, { headers: getHeaders() });
    if (!response.ok) {
        return handleApiError(response, url, 'fetching user repos');
    }
    const repos = await response.json();
    return repos;
};

export const getRepoPulls = async (owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<any[]> => {
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`;
    const response = await fetchWithRetry(url, { headers: getHeaders() });
    if (!response.ok) {
        return handleApiError(response, url, 'fetching pull requests');
    }
    return response.json();
}

export const getRepoLanguages = async (owner: string, repo: string): Promise<any> => {
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/languages`;
    const response = await fetchWithRetry(url, { headers: getHeaders() });
    if (!response.ok) {
        return handleApiError(response, url, 'fetching languages');
    }
    return response.json();
};

export const getRepoContributors = async (owner: string, repo: string): Promise<any[]> => {
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/contributors?per_page=10`;
    const response = await fetchWithRetry(url, { headers: getHeaders() });
    if (!response.ok) {
        return handleApiError(response, url, 'fetching contributors');
    }
    return response.json();
};

export const getRepoIssues = async (owner: string, repo: string, labels: string[]): Promise<any[]> => {
    const octokit = getOctokit();
    try {
        const response = await octokit.rest.issues.listForRepo({
            owner,
            repo,
            labels: labels.join(','),
            state: 'open',
        });
        return response.data;
    } catch (error: any) {
        console.error("GitHub API Error (getRepoIssues):", error);
        throw new GitHubApiError(error.message || 'Failed to fetch repository issues.', error.status || 500);
    }
};

export const createPullRequestForFix = async (
    owner: string,
    repo: string,
    filePath: string,
    newContent: string,
    originalFileSha: string,
    commitMessage: string,
    prTitle: string,
    prBody: string = 'This pull request was automatically generated by Sentinel AI.'
): Promise<string> => {
    const octokit = getOctokit();
    try {
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        const baseBranch = repoData.default_branch;
        const newBranchName = `sentinel-fix-${Date.now()}`;

        const { data: refData } = await octokit.rest.git.getRef({
            owner, repo, ref: `heads/${baseBranch}`,
        });
        const latestCommitSha = refData.object.sha;

        await octokit.rest.git.createRef({
            owner, repo, ref: `refs/heads/${newBranchName}`, sha: latestCommitSha,
        });

        await octokit.rest.repos.createOrUpdateFileContents({
            owner, repo, path: filePath, message: commitMessage, content: btoa(newContent),
            sha: originalFileSha, branch: newBranchName,
        });

        const { data: pullRequest } = await octokit.rest.pulls.create({
            owner, repo, title: prTitle, body: prBody, head: newBranchName, base: baseBranch,
        });

        return pullRequest.html_url;
    } catch (error: any) {
        console.error("PR creation failed:", error);
        const status = error.status;
        const message = (error.message || '').toLowerCase();
        let userFriendlyMessage = `PR creation failed: ${error.message || 'An unknown error occurred.'}`;
        if (status === 403 || status === 404 || message.includes('resource not accessible')) {
            userFriendlyMessage = "Your GitHub Personal Access Token (PAT) is missing the necessary 'repo' scope. Please update your PAT in the Settings page to include the 'repo' scope, which is required for creating branches and committing code changes.";
        }
        throw new GitHubApiError(userFriendlyMessage, status || 500);
    }
};

export const createPullRequestReviewComment = async (
    owner: string,
    repo: string,
    pull_number: number,
    body: string,
    commit_id: string,
    path: string,
    line: number,
): Promise<void> => {
    const octokit = getOctokit();
    try {
        await octokit.rest.pulls.createReviewComment({
            owner, repo, pull_number, body, commit_id, path, line, side: 'RIGHT',
        });
    } catch (error: any) {
        console.error("GitHub API Error (createReviewComment):", error);
        let userMessage = error.message || 'An unexpected error occurred.';
        if (error.status === 403) {
            userMessage = "Permission denied. Your GitHub PAT may be missing the required 'repo' or 'pull_requests:write' scope to post comments.";
        } else if (error.status === 422) {
            userMessage = `Failed to post comment: ${error.message}. The line might not be part of the PR changes.`;
        }
        throw new GitHubApiError(userMessage, error.status || 500);
    }
};

// FEAT: New function for the CVE scanner
export const getDependabotAlerts = async (owner: string, repo: string): Promise<DependabotAlert[]> => {
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/dependabot/alerts`;
    const response = await fetchWithRetry(url, { headers: getHeaders() });
    if (!response.ok) {
        if (response.status === 403) {
            throw new GitHubApiError("Dependabot alerts are not enabled for this repository, or your token is missing the 'security_events' scope.", 403);
        }
        return handleApiError(response, url, 'fetching dependabot alerts');
    }
    const alerts: DependabotAlert[] = await response.json();
    return alerts.filter(alert => alert.state === 'open');
};

// FEAT: New function to create/update README.md and open a PR.
export const createOrUpdateReadmeAndPR = async (
    owner: string,
    repo: string,
    content: string,
    prTitle: string,
    prBody: string
): Promise<string> => {
    const octokit = getOctokit();
    try {
        // 1. Get default branch
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        const baseBranch = repoData.default_branch;
        const newBranchName = `docs/sentinel-readme-${Date.now()}`;

        // 2. Create a new branch from the default branch's HEAD
        const { data: refData } = await octokit.rest.git.getRef({
            owner, repo, ref: `heads/${baseBranch}`,
        });
        const latestCommitSha = refData.object.sha;
        await octokit.rest.git.createRef({
            owner, repo, ref: `refs/heads/${newBranchName}`, sha: latestCommitSha,
        });

        // 3. Get the current README's SHA (if it exists)
        let currentFileSha: string | undefined;
        try {
            const { data: fileData } = await octokit.rest.repos.getContent({
                owner, repo, path: 'README.md', ref: newBranchName,
            });
            if (!Array.isArray(fileData) && fileData.type === 'file') {
                currentFileSha = fileData.sha;
            }
        } catch (error: any) {
            if (error.status !== 404) throw error; // Re-throw if it's not a 'not found' error
            // README.md doesn't exist, which is fine. We'll create it.
        }

        // 4. Create or update the file on the new branch
        await octokit.rest.repos.createOrUpdateFileContents({
            owner, repo, path: 'README.md',
            message: "docs: add/update README.md with Sentinel AI",
            // Use unescape/encodeURIComponent to handle UTF-8 characters correctly with btoa
            content: btoa(unescape(encodeURIComponent(content))),
            sha: currentFileSha,
            branch: newBranchName,
        });

        // 5. Create the pull request
        const { data: pullRequest } = await octokit.rest.pulls.create({
            owner, repo, title: prTitle, body: prBody, head: newBranchName, base: baseBranch,
        });

        return pullRequest.html_url;

    } catch (error: any) {
        console.error("README PR creation failed:", error);
        const status = error.status;
        const message = (error.message || '').toLowerCase();
        let userFriendlyMessage = `PR creation failed: ${error.message || 'An unknown error occurred.'}`;
        if (status === 403 || status === 404 || message.includes('resource not accessible')) {
            userFriendlyMessage = "Your GitHub PAT is missing the 'repo' scope. Please update it in Settings to allow creating branches and committing files.";
        }
        throw new GitHubApiError(userFriendlyMessage, status || 500);
    }
};

// FEAT: New function to perform a deep repository analysis for the README generator.
export const getRepoContextForReadme = async (repoFullName: string): Promise<ReadmeGenerationContext> => {
    const octokit = getOctokit();
    const parsed = parseGitHubUrl(`https://github.com/${repoFullName}`);
    if (!parsed) throw new Error("Invalid repository name.");
    const { owner, repo } = parsed;

    const [repoData, languages, contributors, packageJsonRes] = await Promise.all([
        octokit.rest.repos.get({ owner, repo }),
        octokit.rest.repos.listLanguages({ owner, repo }),
        octokit.rest.repos.listContributors({ owner, repo, per_page: 5 }),
        octokit.rest.repos.getContent({ owner, repo, path: 'package.json' }).catch(() => null)
    ]);

    let dependencies: string[] = [];
    let devDependencies: string[] = [];
    if (packageJsonRes && 'content' in packageJsonRes.data) {
        try {
            const packageJsonContent = JSON.parse(atob(packageJsonRes.data.content));
            dependencies = Object.keys(packageJsonContent.dependencies || {});
            devDependencies = Object.keys(packageJsonContent.devDependencies || {});
        } catch (e) {
            console.warn("Could not parse package.json for README context.");
        }
    }

    const mainLanguage = languages.data ? Object.keys(languages.data)[0] : null;

    const topContributors = contributors.data
        .map(c => c.login)
        .filter((login): login is string => !!login);

    return {
        repoName: repoData.data.full_name,
        repoDescription: repoData.data.description,
        stars: repoData.data.stargazers_count,
        forks: repoData.data.forks_count,
        license: repoData.data.license?.name || null,
        mainLanguage: mainLanguage,
        topics: repoData.data.topics || [],
        dependencies,
        devDependencies,
        topContributors,
    };
};

// FEAT: New function for the Command Center to fetch repo health
export interface RepoHealthData {
    fullName: string;
    critical: number;
    high: number;
    total: number;
    index: number;
}

export const getMonitoredReposHealth = async (repos: Repository[]): Promise<RepoHealthData[]> => {
    const monitoredRepos = repos.filter(r => r.autoReview);
    if (monitoredRepos.length === 0) return [];

    const healthPromises = monitoredRepos.map(async (repo, index) => {
        try {
            const parsed = parseGitHubUrl(`https://github.com/${repo.full_name}`);
            if (!parsed) throw new Error(`Invalid repo name: ${repo.full_name}`);

            const alerts = await getDependabotAlerts(parsed.owner, parsed.repo);
            const critical = alerts.filter(a => a.security_advisory.severity === 'critical').length;
            const high = alerts.filter(a => a.security_advisory.severity === 'high').length;

            return {
                fullName: repo.full_name,
                critical,
                high,
                total: alerts.length,
                index
            };
        } catch (error: any) {
            console.warn(`Could not fetch health for ${repo.full_name}: ${error.message}`);
            // Return zero-state on error so the dashboard doesn't break
            return {
                fullName: repo.full_name,
                critical: 0,
                high: 0,
                total: 0,
                index
            };
        }
    });

    return Promise.all(healthPromises);
};

// FEAT: Direct Push Functionality
export const pushFileToRepo = async (
    owner: string,
    repo: string,
    filePath: string,
    content: string,
    commitMessage: string,
    branch?: string
): Promise<void> => {
    const octokit = getOctokit();
    try {
        // 1. Get the current file SHA (if it exists) to allow updates
        let sha: string | undefined;
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: filePath,
                ref: branch,
            });
            if (!Array.isArray(data) && data.type === 'file') {
                sha = data.sha;
            }
        } catch (e: any) {
            if (e.status !== 404) throw e;
        }

        // 2. Create or update the file
        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: commitMessage,
            content: btoa(unescape(encodeURIComponent(content))),
            sha,
            branch,
        });

    } catch (error: any) {
        console.error("Direct push failed:", error);
        let userMessage = error.message || 'An unknown error occurred.';
        if (error.status === 403) {
            userMessage = "Permission denied. Your GitHub PAT is missing the 'repo' scope required to push code.";
        }
        throw new GitHubApiError(userMessage, error.status || 500);
    }
};