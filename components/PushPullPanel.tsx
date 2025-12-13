import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from './ToastContext';
import { SpinnerIcon, GithubIcon, PullRequestIcon, SettingsIcon, ShieldIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon, SearchIcon, RepoIcon, UploadIcon, FileCodeIcon, CheckCircleIcon } from './icons';
import { DashboardView, AnalysisIssue, Repository } from '../types';
import { analyzeCode, isApiKeySet } from '../services/geminiService';
import { parseGitHubUrl, createPullRequestReviewComment, getRepoPulls, pushFileToRepo } from '../services/githubService';
import { Octokit } from 'octokit';
import { logAlert, addScan } from '../services/dbService';
import ToggleSwitch from './ToggleSwitch';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { atomone } from '@uiw/codemirror-theme-atomone';
import { javascript } from '@codemirror/lang-javascript';

declare global {
    interface Window {
        hljs: any;
    }
}

interface ChangedFile {
    sha: string;
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed' | 'copied' | 'changed' | 'unchanged';
    additions: number;
    deletions: number;
    patch?: string;
}

interface PullRequestDetails {
    html_url: string;
    head: {
        sha: string;
        ref: string;
    }
}

interface PushPullPanelProps {
    setActiveView: (view: DashboardView) => void;
    repos: Repository[];
}

const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
        js: 'javascript', ts: 'typescript', py: 'python',
        tsx: 'typescript', jsx: 'javascript', hcl: 'hcl', tf: 'hcl'
    };
    return langMap[ext || ''] || 'plaintext';
};

const IssueComment: React.FC<{
    issue: AnalysisIssue;
    onCommitFix: (issue: AnalysisIssue) => void;
    isCommitting: boolean;
}> = ({ issue, onCommitFix, isCommitting }) => {
    const severityColors: Record<string, string> = {
        Critical: 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
        High: 'bg-orange-500/10 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]',
        Medium: 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]',
        Low: 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border-l-2 rounded-r-xl my-4 text-sm bg-black/40 backdrop-blur-md border overflow-hidden ${severityColors[issue.severity]}`}
        >
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center space-x-3">
                    <ShieldIcon severity={issue.severity} className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold text-white font-heading">{issue.title}</span>
                </div>
            </div>
            <div className="p-4 space-y-4">
                <p className="text-gray-300 text-xs leading-relaxed">{issue.description}</p>
                <div>
                    <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider mb-2">Suggested Fix</h4>
                    <pre className="bg-black/50 p-3 rounded-lg font-mono text-xs overflow-x-auto border border-white/10 custom-scrollbar">
                        <code className="text-emerald-400">{issue.suggestedFix}</code>
                    </pre>
                </div>
                <div className="pt-2">
                    <motion.button
                        onClick={() => onCommitFix(issue)}
                        disabled={isCommitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-lg disabled:opacity-50 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all flex items-center space-x-2"
                    >
                        {isCommitting ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <span>Post Fix as Comment</span>}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

const DiffView: React.FC<{
    patch: string;
    issues: AnalysisIssue[];
    onCommitFix: (issue: AnalysisIssue) => void;
    committingIssue: AnalysisIssue | null;
}> = ({ patch, issues, onCommitFix, committingIssue }) => {
    const memoizedDiff = useMemo(() => {
        if (!patch) return [];

        const highlightedDiff = window.hljs?.highlight(patch, { language: 'diff', ignoreIllegals: true }).value || patch;
        const highlightedLines = highlightedDiff.split('\n');
        const rawLines = patch.split('\n');

        let fileLineNumber = 0;

        return rawLines.map((rawLine, index) => {
            const highlightedLine = highlightedLines[index] || '';
            let lineType = 'context';
            let currentLineNumberForIssues = -1;

            if (rawLine.startsWith('@@')) {
                lineType = 'hunk';
                const match = rawLine.match(/\+(\d+)/);
                if (match) fileLineNumber = parseInt(match[1], 10) - 1;
            } else if (rawLine.startsWith('+')) {
                lineType = 'addition';
                if (!rawLine.startsWith('+++')) {
                    fileLineNumber++;
                    currentLineNumberForIssues = fileLineNumber;
                }
            } else if (rawLine.startsWith('-')) {
                lineType = 'deletion';
            } else {
                if (!rawLine.startsWith('\\ No newline')) {
                    fileLineNumber++;
                }
            }

            const issuesForThisLine = currentLineNumberForIssues > 0
                ? issues.filter(i => i.line === currentLineNumberForIssues)
                : [];

            return {
                key: `${index}-${rawLine}`,
                lineType,
                highlightedContent: highlightedLine,
                issues: issuesForThisLine,
            };
        });
    }, [patch, issues]);

    return (
        <div className="font-mono text-xs whitespace-pre-wrap break-words bg-black/20 rounded-xl overflow-hidden border border-white/5">
            {memoizedDiff.map(({ key, lineType, highlightedContent, issues }) => (
                <React.Fragment key={key}>
                    <div className={`flex items-start px-2 py-0.5 ${lineType === 'addition' ? 'bg-emerald-500/10' :
                        lineType === 'deletion' ? 'bg-red-500/10' :
                            lineType === 'hunk' ? 'bg-blue-500/10 text-blue-400 py-2 my-1 rounded' : ''
                        }`}>
                        <span className={`w-6 text-right pr-3 select-none text-gray-600 font-mono text-[10px] pt-0.5 ${lineType === 'addition' ? 'text-emerald-500' :
                            lineType === 'deletion' ? 'text-red-500' : ''
                            }`}>
                            {lineType === 'addition' ? '+' : lineType === 'deletion' ? '-' : ' '}
                        </span>
                        <span className="flex-1 text-gray-300" dangerouslySetInnerHTML={{ __html: highlightedContent || ' ' }} />
                    </div>
                    {issues.length > 0 && (
                        <div className="flex px-4 pb-4 bg-black/40">
                            <div className="w-6 flex-shrink-0"></div>
                            <div className="flex-1">
                                {issues.map((issue, issueIdx) => {
                                    const isThisIssueActive = committingIssue?.line === issue.line && committingIssue?.title === issue.title;
                                    return (
                                        <IssueComment
                                            key={issueIdx}
                                            issue={issue}
                                            onCommitFix={onCommitFix}
                                            isCommitting={isThisIssueActive}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};


const PushPullPanel: React.FC<PushPullPanelProps> = ({ setActiveView, repos }) => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [octokit, setOctokit] = useState<Octokit | null>(null);
    const [selectedRepoFullName, setSelectedRepoFullName] = useState('');
    const [useManualInput, setUseManualInput] = useState(false);
    const [manualPrUrl, setManualPrUrl] = useState('');
    const [pullRequests, setPullRequests] = useState<any[]>([]);
    const [selectedPR, setSelectedPR] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCommitting, setIsCommitting] = useState<AnalysisIssue | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [changedFiles, setChangedFiles] = useState<ChangedFile[]>([]);
    const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisIssue[]>>({});
    const [selectedFile, setSelectedFile] = useState<ChangedFile | null>(null);
    const [prDetails, setPrDetails] = useState<PullRequestDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFilePanelCollapsed, setIsFilePanelCollapsed] = useState(false);

    // Push Mode State
    const [mode, setMode] = useState<'review' | 'push'>('review');
    const [pushFilePath, setPushFilePath] = useState('');
    const [pushContent, setPushContent] = useState('');
    const [pushCommitMessage, setPushCommitMessage] = useState('');
    const [isPushing, setIsPushing] = useState(false);

    useEffect(() => {
        if (repos.length > 0 && !selectedRepoFullName) {
            setSelectedRepoFullName(repos[0].full_name);
        }
    }, [repos, selectedRepoFullName]);

    useEffect(() => {
        const token = localStorage.getItem('sentinel-github-pat');
        const keySet = isApiKeySet();

        if (!token || !keySet) {
            setError('GitHub PAT and Gemini API Key are required. Please configure them in Settings.');
        } else {
            try {
                if (token) {
                    setOctokit(new Octokit({ auth: token }));
                }
            } catch (e) {
                setError('Failed to initialize GitHub client. The library might not have loaded correctly.');
            }
        }
    }, []);

    const fetchRepoPRs = useCallback(async (repoFullName: string) => {
        if (!octokit || !repoFullName || useManualInput) return;

        setIsLoading(true);
        setStatusMessage('Fetching open pull requests...');
        setPullRequests([]);
        setSelectedPR(null);
        setChangedFiles([]);
        setAnalysisResults({});
        setSelectedFile(null);

        try {
            const parsed = parseGitHubUrl(`https://github.com/${repoFullName}`);
            if (!parsed) throw new Error("Invalid repo name");
            const prs = await getRepoPulls(parsed.owner, parsed.repo);
            setPullRequests(prs);
            setStatusMessage(prs.length > 0 ? 'Select a PR to review.' : 'No open pull requests found.');
        } catch (err: any) {
            addToast(`Error fetching PRs: ${err.message}`, 'error');
            setStatusMessage(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [octokit, addToast, useManualInput]);

    useEffect(() => {
        fetchRepoPRs(selectedRepoFullName);
    }, [selectedRepoFullName, fetchRepoPRs]);

    const handleBackToPRs = () => {
        setSelectedPR(null);
        setChangedFiles([]);
        setAnalysisResults({});
        setSelectedFile(null);
        if (!useManualInput) {
            fetchRepoPRs(selectedRepoFullName);
        }
    };


    const handleReview = async (pr: any, filenameToSelect?: string) => {
        if (!octokit) return;

        setSelectedPR(pr);
        const prUrl = pr.html_url;
        const parsedUrl = parseGitHubUrl(prUrl);
        if (!parsedUrl || !parsedUrl.pull) {
            addToast('Invalid GitHub Pull Request URL.', 'error');
            return;
        }

        const { owner, repo, pull: pull_number_str } = parsedUrl;
        const pull_number = parseInt(pull_number_str);

        setIsLoading(true);
        setStatusMessage('Fetching changed files from PR...');
        setChangedFiles([]);
        setAnalysisResults({});
        setSelectedFile(null);
        setPrDetails(null);

        try {
            const { data: prData } = await octokit.rest.pulls.get({ owner, repo, pull_number });
            setPrDetails(prData);

            const { data: files } = await octokit.rest.pulls.listFiles({ owner, repo, pull_number });
            const filesToAnalyze = files.filter(f => f.status !== 'removed' && f.patch && /\.(py|ts|tsx|js|jsx|tf|hcl)$/i.test(f.filename));
            setChangedFiles(filesToAnalyze);

            if (filesToAnalyze.length === 0) {
                setStatusMessage('No code changes to analyze in this PR.');
                setIsLoading(false);
                return;
            }

            let totalIssuesFound = 0;

            const analysisPromises = filesToAnalyze.map(async (file, index) => {
                setStatusMessage(`(${index + 1}/${filesToAnalyze.length}) Analyzing ${file.filename}...`);

                let content = '';
                try {
                    const { data: contentData } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', { owner, repo, path: file.filename, ref: prData.head.sha });
                    if ('content' in contentData) {
                        content = atob(contentData.content);
                    } else {
                        throw new Error('Could not retrieve file content.');
                    }
                } catch (e) {
                    console.error(`Could not fetch content for ${file.filename}. Skipping analysis.`, e);
                    return { filename: file.filename, issues: [] };
                }

                const language = getLanguage(file.filename);
                const issues = await analyzeCode(content, language);

                const addedLinesInPatch = new Set<number>();
                const patchLines = file.patch?.split('\n') || [];
                let currentLine = 0;

                for (const line of patchLines) {
                    if (line.startsWith('@@')) {
                        const match = line.match(/\+(\d+)/);
                        if (match) currentLine = parseInt(match[1], 10) - 1;
                    }
                    if (!line.startsWith('-') && !line.startsWith('@@') && !line.startsWith('\\')) {
                        currentLine++;
                    }
                    if (line.startsWith('+')) {
                        addedLinesInPatch.add(currentLine);
                    }
                }

                const relevantIssues = issues
                    .filter(issue => addedLinesInPatch.has(issue.line))
                    .map(issue => ({ ...issue, filePath: file.filename }));

                totalIssuesFound += relevantIssues.length;

                return { filename: file.filename, issues: relevantIssues };
            });

            const results = await Promise.all(analysisPromises);

            const finalResults: Record<string, AnalysisIssue[]> = {};
            results.forEach(res => {
                if (res.issues.length > 0) {
                    finalResults[res.filename] = res.issues;
                    addScan({
                        repoFullName: `${owner}/${repo}`,
                        filePath: res.filename,
                        timestamp: Date.now(),
                        issues: res.issues,
                        status: 'open',
                        source: 'pr-review'
                    }).catch(console.error);
                }
            });

            setAnalysisResults(finalResults);

            if (totalIssuesFound > 0) {
                const alertDetails = `Found ${totalIssuesFound} new issue(s) in PR #${pull_number}.`;
                addToast(alertDetails, 'info');
                await logAlert({ repoFullName: `${owner}/${repo}`, type: 'PR_COMMENT', details: alertDetails, timestamp: Date.now(), url: prUrl });
            }

            if (filesToAnalyze.length > 0) {
                let fileToReselect = null;
                if (filenameToSelect) {
                    fileToReselect = filesToAnalyze.find(f => f.filename === filenameToSelect);
                }
                setSelectedFile(fileToReselect || filesToAnalyze[0]);
            }
            setStatusMessage(`Analysis complete. Found ${totalIssuesFound} new issues.`);

        } catch (err: any) {
            addToast(`Error reviewing PR: ${err.message}`, 'error');
            setStatusMessage('');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostComment = async (issue: AnalysisIssue) => {
        if (!octokit || !prDetails || !issue.filePath) return;

        const prUrl = prDetails.html_url;
        const parsedUrl = parseGitHubUrl(prUrl);
        if (!parsedUrl || !parsedUrl.pull) return;

        setIsCommitting(issue);
        addToast(`Posting comment for ${issue.title}...`, 'info');
        try {
            const { owner, repo, pull: pull_number_str } = parsedUrl;
            const pull_number = parseInt(pull_number_str);
            const headSha = prDetails.head.sha;

            const commentBody = `**Sentinel AI Analysis**\n\n**Severity:** ${issue.severity}\n\n**Issue:** ${issue.description}\n\n**Impact:** ${issue.impact}\n\n---\n\n**Suggested Fix:**\n\`\`\`${getLanguage(issue.filePath!)}\n${issue.suggestedFix}\n\`\`\``;

            await createPullRequestReviewComment(owner, repo, pull_number, commentBody, headSha, issue.filePath, issue.line);

            addToast('Comment posted successfully!', 'success');
        } catch (err: any) {
            addToast(`Failed to post comment: ${err.message}`, 'error');
        } finally {
            setIsCommitting(null);
        }
    };

    const handleManualReview = async () => {
        if (!octokit || !manualPrUrl) return;

        const parsedUrl = parseGitHubUrl(manualPrUrl);
        if (!parsedUrl || !parsedUrl.pull) {
            addToast('Invalid or incomplete GitHub Pull Request URL.', 'error');
            return;
        }

        setIsLoading(true);
        setStatusMessage('Fetching PR details...');
        try {
            const { owner, repo, pull: pull_number_str } = parsedUrl;
            const pull_number = parseInt(pull_number_str);
            const { data: prData } = await octokit.rest.pulls.get({ owner, repo, pull_number });
            await handleReview(prData);
        } catch (err: any) {
            addToast(`Error fetching PR: ${err.message}`, 'error');
            setStatusMessage(`Error: ${err.message}`);
            setIsLoading(false);
        }
    };

    const handlePush = async () => {
        if (!selectedRepoFullName || !pushFilePath || !pushContent || !pushCommitMessage) {
            addToast('Please fill in all fields.', 'warning');
            return;
        }

        setIsPushing(true);
        try {
            const parsed = parseGitHubUrl(`https://github.com/${selectedRepoFullName}`);
            if (!parsed) throw new Error("Invalid repo name");

            await pushFileToRepo(
                parsed.owner,
                parsed.repo,
                pushFilePath,
                pushContent,
                pushCommitMessage
            );

            addToast('Successfully pushed changes to repository!', 'success');
            setPushContent('');
            setPushCommitMessage('');
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setIsPushing(false);
        }
    };

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <SettingsIcon className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Configuration Required</h3>
                    <p className="text-gray-400 max-w-sm text-sm leading-relaxed mb-8">{error}</p>
                    <motion.button
                        onClick={() => navigate('/app/settings')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-white text-black font-bold text-sm rounded-full flex items-center space-x-2 mx-auto hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
                    >
                        <SettingsIcon className="w-4 h-4" />
                        <span>Configure Access</span>
                    </motion.button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-fade-in-up">
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex-shrink-0 space-y-4 bg-black/20">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white font-heading tracking-tight">
                        {mode === 'review' ? 'PR Review' : 'Direct Push'}
                    </h1>
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        <button
                            onClick={() => setMode('review')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'review' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Review PRs
                        </button>
                        <button
                            onClick={() => setMode('push')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'push' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Direct Push
                        </button>
                    </div>
                </div>

                {mode === 'review' ? (
                    <>
                        <div className="flex items-center space-x-3">
                            <div className="relative flex-grow group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    {useManualInput ? <SearchIcon className="h-4 w-4 text-gray-500" /> : <RepoIcon className="h-4 w-4 text-gray-500" />}
                                </div>
                                {useManualInput ? (
                                    <input
                                        type="text"
                                        value={manualPrUrl}
                                        onChange={e => setManualPrUrl(e.target.value)}
                                        placeholder="https://github.com/owner/repo/pull/123"
                                        className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono"
                                    />
                                ) : repos.length > 0 ? (
                                    <select
                                        value={selectedRepoFullName}
                                        onChange={(e) => setSelectedRepoFullName(e.target.value)}
                                        disabled={isLoading || !!selectedPR}
                                        className="block w-full pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
                                    </select>
                                ) : (
                                    <input type="text" value="Please add a repository first" disabled className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-500 font-mono" />
                                )}
                            </div>
                            {useManualInput && (
                                <motion.button
                                    onClick={handleManualReview}
                                    disabled={isLoading || !manualPrUrl}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-6 py-3 bg-white text-black font-bold text-xs rounded-xl disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
                                >
                                    Review
                                </motion.button>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Mode:</span>
                                <div className="flex items-center space-x-2 bg-white/5 px-2 py-1 rounded-lg">
                                    <span className={`text-[10px] ${!useManualInput ? 'text-white font-bold' : 'text-gray-500'}`}>Repo</span>
                                    <ToggleSwitch enabled={useManualInput} setEnabled={setUseManualInput} />
                                    <span className={`text-[10px] ${useManualInput ? 'text-white font-bold' : 'text-gray-500'}`}>Manual</span>
                                </div>
                            </div>
                            {(isLoading || statusMessage) && (
                                <div className="flex items-center space-x-2">
                                    {isLoading && <SpinnerIcon className="w-3 h-3 text-blue-400 animate-spin" />}
                                    <p className="text-[10px] text-gray-400 font-mono">{statusMessage}</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center space-x-3">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <RepoIcon className="h-4 w-4 text-gray-500" />
                            </div>
                            <select
                                value={selectedRepoFullName}
                                onChange={(e) => setSelectedRepoFullName(e.target.value)}
                                className="block w-full pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                            >
                                {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {mode === 'review' ? (
                selectedPR ? (
                    <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                        {/* File List Panel */}
                        <motion.div
                            initial={false}
                            animate={{ width: isFilePanelCollapsed ? '4rem' : '20rem' }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                            className="flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col bg-black/20"
                        >
                            <div className="flex-shrink-0 p-4 flex items-center justify-between border-b border-white/5">
                                {!isFilePanelCollapsed && <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{changedFiles.length} Changed Files</h3>}
                                <button onClick={() => setIsFilePanelCollapsed(!isFilePanelCollapsed)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                                    {isFilePanelCollapsed ? <DoubleArrowRightIcon className="w-4 h-4" /> : <DoubleArrowLeftIcon className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {!isFilePanelCollapsed && changedFiles.map(file => (
                                    <motion.button
                                        key={file.sha}
                                        onClick={() => setSelectedFile(file)}
                                        whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                        className={`w-full text-left p-3 rounded-lg text-xs flex justify-between items-center transition-all group ${selectedFile?.sha === file.sha
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            : 'text-gray-400 border border-transparent'
                                            }`}
                                    >
                                        <span className="truncate font-mono">{file.filename}</span>
                                        {analysisResults[file.filename]?.length > 0 &&
                                            <span className="flex-shrink-0 ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-orange-500/20 text-orange-400 font-bold shadow-[0_0_10px_rgba(249,115,22,0.2)]">{analysisResults[file.filename].length}</span>
                                        }
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                        {/* Diff View */}
                        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-black/20">
                            {selectedFile && (
                                <div className="animate-fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-white font-mono">{selectedFile.filename}</h3>
                                        <div className="flex items-center space-x-3 text-xs">
                                            <span className="text-emerald-400">+{selectedFile.additions}</span>
                                            <span className="text-red-400">-{selectedFile.deletions}</span>
                                        </div>
                                    </div>
                                    <DiffView
                                        patch={selectedFile.patch || ''}
                                        issues={analysisResults[selectedFile.filename] || []}
                                        onCommitFix={handlePostComment}
                                        committingIssue={isCommitting}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                        {!useManualInput && pullRequests.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {pullRequests.map(pr => (
                                    <motion.button
                                        key={pr.id}
                                        onClick={() => handleReview(pr)}
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className="text-left p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                    <PullRequestIcon className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <span className="font-mono text-xs text-gray-500">#{pr.number}</span>
                                            </div>
                                            <h3 className="font-bold text-white text-sm mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">{pr.title}</h3>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-bold">
                                                    {pr.user.login.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{pr.user.login}</span>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-center h-full">
                                <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <PullRequestIcon className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 font-heading">No Pull Requests</h3>
                                    <p className="text-gray-500 text-sm max-w-xs mx-auto">{statusMessage || 'Select a repository or enter a PR URL to begin analysis.'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )
            ) : (
                <div className="flex-grow flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto w-full">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target File Path</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FileCodeIcon className="h-4 w-4 text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    value={pushFilePath}
                                    onChange={(e) => setPushFilePath(e.target.value)}
                                    placeholder="src/components/Button.tsx"
                                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono"
                                />
                            </div>
                            <p className="text-[10px] text-gray-500">Enter the full path including filename and extension.</p>
                        </div>

                        <div className="space-y-2 flex-grow flex flex-col min-h-[400px]">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">File Content</label>
                            <div className="flex-grow border border-white/10 rounded-xl overflow-hidden shadow-inner bg-black/30">
                                <CodeMirror
                                    value={pushContent}
                                    onChange={(value) => setPushContent(value)}
                                    extensions={[javascript({ jsx: true })]}
                                    theme={atomone}
                                    className="h-full text-sm"
                                    height="100%"
                                    minHeight="400px"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Commit Message</label>
                            <input
                                type="text"
                                value={pushCommitMessage}
                                onChange={(e) => setPushCommitMessage(e.target.value)}
                                placeholder="feat: update button component"
                                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono"
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <motion.button
                                onClick={handlePush}
                                disabled={isPushing || !selectedRepoFullName || !pushFilePath || !pushContent || !pushCommitMessage}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                            >
                                {isPushing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <UploadIcon className="w-5 h-5" />}
                                <span>{isPushing ? 'Pushing...' : 'Push to Repository'}</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PushPullPanel;