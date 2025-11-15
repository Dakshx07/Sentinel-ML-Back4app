import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from './ToastContext';
import { SpinnerIcon, GithubIcon, PullRequestIcon, SettingsIcon, ShieldIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from './icons';
import { DashboardView, AnalysisIssue, Repository } from '../types';
import { analyzeCode, isApiKeySet } from '../services/geminiService';
import { parseGitHubUrl, createPullRequestReviewComment, getRepoPulls } from '../services/githubService';
import { Octokit } from 'octokit';
import { logAlert, addScan } from '../services/dbService';
import ToggleSwitch from './ToggleSwitch';

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
}> = ({ issue, onCommitFix, isCommitting }) => (
    <div className="border border-gray-200 dark:border-white/10 bg-light-primary dark:bg-dark-primary my-2 rounded-lg text-sm">
        <div className={`flex items-center justify-between p-2 border-b border-gray-200 dark:border-white/10 ${
            {'Critical': 'bg-red-500/10', 'High': 'bg-orange-500/10', 'Medium': 'bg-yellow-500/10', 'Low': 'bg-blue-500/10'}[issue.severity] || ''
        }`}>
            <div className="flex items-center space-x-2">
                 <ShieldIcon severity={issue.severity} className="w-5 h-5 flex-shrink-0" />
                 <span className="font-bold text-dark-text dark:text-white">{issue.title}</span>
            </div>
        </div>
        <div className="p-3 space-y-3">
            <p className="text-medium-dark-text dark:text-medium-text whitespace-pre-wrap">{issue.description}</p>
            <div>
                <h4 className="font-semibold text-dark-text dark:text-white">Suggested Fix:</h4>
                <pre className="mt-1 bg-light-secondary dark:bg-dark-secondary p-2 rounded-md font-mono text-xs overflow-x-auto horizontal-scroller">
                    <code>{issue.suggestedFix}</code>
                </pre>
            </div>
            <div className="pt-2 flex items-center space-x-2">
                 <button 
                    onClick={() => onCommitFix(issue)}
                    disabled={isCommitting}
                    className="btn-secondary text-xs py-1 px-3 disabled:opacity-50"
                >
                    {isCommitting ? <SpinnerIcon className="w-4 h-4"/> : 'Post Fix as Comment'}
                </button>
            </div>
        </div>
    </div>
);

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
                if (match) fileLineNumber = parseInt(match[1], 10) -1;
            } else if (rawLine.startsWith('+')) {
                lineType = 'addition';
                if(!rawLine.startsWith('+++')) {
                    fileLineNumber++;
                    currentLineNumberForIssues = fileLineNumber;
                }
            } else if (rawLine.startsWith('-')) {
                lineType = 'deletion';
            } else {
                 if(!rawLine.startsWith('\\ No newline')) {
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
        <pre className="font-mono text-xs whitespace-pre-wrap break-words">
            <code>
                {memoizedDiff.map(({ key, lineType, highlightedContent, issues }) => (
                    <React.Fragment key={key}>
                        <div className={`flex items-start ${
                            lineType === 'addition' ? 'bg-green-500/10' :
                            lineType === 'deletion' ? 'bg-red-500/10' : ''
                        }`}>
                            <span className={`w-10 text-right pr-2 select-none text-medium-dark-text dark:text-medium-text/50 ${
                                lineType === 'addition' ? 'text-green-500' :
                                lineType === 'deletion' ? 'text-red-500' : ''
                            }`}>
                                {lineType === 'addition' ? '+' : lineType === 'deletion' ? '-' : ' '}
                            </span>
                            <span className="flex-1" dangerouslySetInnerHTML={{ __html: highlightedContent || ' ' }} />
                        </div>
                        {issues.length > 0 && (
                            <div className="flex">
                                <div className="w-10 flex-shrink-0"></div>
                                <div className="flex-1 my-2">
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
            </code>
        </pre>
    );
};


const PushPullPanel: React.FC<PushPullPanelProps> = ({ setActiveView, repos }) => {
    const { addToast } = useToast();
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
        if(!useManualInput) {
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
                } catch(e) {
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
                        if (match) currentLine = parseInt(match[1], 10) -1;
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
                    .map(issue => ({...issue, filePath: file.filename}));
                
                totalIssuesFound += relevantIssues.length;

                return { filename: file.filename, issues: relevantIssues };
            });

            const results = await Promise.all(analysisPromises);
            
            const finalResults: Record<string, AnalysisIssue[]> = {};
            results.forEach(res => {
                if(res.issues.length > 0) {
                   finalResults[res.filename] = res.issues;
                   // Log each file scan to DB
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

            if(totalIssuesFound > 0) {
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
    
    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center p-4 glass-effect rounded-lg">
                <div className="text-center">
                     <p className="text-lg text-medium-dark-text dark:text-medium-text">{error}</p>
                     <button onClick={() => setActiveView('settings')} className="mt-4 btn-primary flex items-center space-x-2 py-2 px-4 mx-auto">
                        <SettingsIcon className="w-5 h-5" />
                        <span>Go to Settings</span>
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="h-full w-full flex flex-col glass-effect rounded-lg overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0 space-y-3">
                 <div className="flex flex-wrap gap-2 items-center justify-between">
                    <h1 className="text-2xl font-bold font-heading">Interactive PR Review</h1>
                    {selectedPR && (
                        <button onClick={handleBackToPRs} className="btn-secondary text-sm py-1 px-3">
                            Back to PRs
                        </button>
                    )}
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative flex-grow">
                        <GithubIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-medium-dark-text dark:text-medium-text" />
                        {useManualInput ? (
                             <input type="text" value={manualPrUrl} onChange={e => setManualPrUrl(e.target.value)} placeholder="https://github.com/owner/repo/pull/123"
                                className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-2 pl-10 font-mono text-sm"/>
                        ) : repos.length > 0 ? (
                             <select 
                                value={selectedRepoFullName} 
                                onChange={(e) => setSelectedRepoFullName(e.target.value)} 
                                disabled={isLoading || !!selectedPR}
                                className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-2 pl-10 font-mono text-sm text-dark-text dark:text-light-text focus:outline-none focus:ring-2 focus:ring-brand-purple"
                            >
                                {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
                            </select>
                        ) : (
                            <input type="text" value="Please add a repository first" disabled className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-2 pl-10 font-mono text-sm"/>
                        )}
                    </div>
                    {useManualInput && (
                        <button onClick={handleManualReview} disabled={isLoading || !manualPrUrl} className="btn-primary py-2 px-4 disabled:opacity-50">Review PR</button>
                    )}
                </div>
                 <div className="flex items-center space-x-2">
                    <ToggleSwitch enabled={useManualInput} setEnabled={setUseManualInput} />
                    <span className="text-xs text-medium-dark-text dark:text-medium-text">Enter Manually</span>
                </div>
                {(isLoading || statusMessage) && <p className="text-sm text-center text-medium-dark-text dark:text-medium-text truncate">{statusMessage}</p>}
            </div>

            {selectedPR ? (
                <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                    <div 
                        className="w-full lg:w-1/3 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/10 flex flex-col transition-all duration-300"
                        style={{ width: isFilePanelCollapsed ? '3rem' : '' }}
                    >
                         <div className="flex-shrink-0 p-2 flex items-center justify-between border-b border-gray-200 dark:border-white/10">
                            {!isFilePanelCollapsed && <h3 className="text-sm font-semibold uppercase tracking-wider text-medium-dark-text dark:text-medium-text">{changedFiles.length} Changed Files</h3>}
                             <button onClick={() => setIsFilePanelCollapsed(!isFilePanelCollapsed)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10" title={isFilePanelCollapsed ? "Expand" : "Collapse"}>
                                {isFilePanelCollapsed ? <DoubleArrowRightIcon className="w-4 h-4" /> : <DoubleArrowLeftIcon className="w-4 h-4" />}
                            </button>
                         </div>
                         <div className="flex-grow overflow-y-auto p-2">
                             {!isFilePanelCollapsed && changedFiles.map(file => (
                                 <button key={file.sha} onClick={() => setSelectedFile(file)}
                                     className={`w-full text-left p-2 rounded-md my-1 text-sm flex justify-between items-center ${selectedFile?.sha === file.sha ? 'bg-brand-purple/20' : 'hover:bg-gray-200 dark:hover:bg-white/5'}`}
                                 >
                                     <span className="truncate">{file.filename}</span>
                                     {analysisResults[file.filename]?.length > 0 && 
                                        <span className="flex-shrink-0 ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-500 font-semibold">{analysisResults[file.filename].length}</span>
                                     }
                                 </button>
                             ))}
                         </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4">
                        {selectedFile && <DiffView 
                            patch={selectedFile.patch || ''} 
                            issues={analysisResults[selectedFile.filename] || []} 
                            onCommitFix={handlePostComment} 
                            committingIssue={isCommitting}
                        />}
                    </div>
                </div>
            ) : (
                 <div className="flex-grow overflow-y-auto p-4">
                    {!useManualInput && pullRequests.length > 0 ? (
                        <ul className="space-y-2">
                            {pullRequests.map(pr => (
                                <li key={pr.id}>
                                    <button onClick={() => handleReview(pr)} className="w-full text-left p-3 rounded-md hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors">
                                        <p className="font-semibold text-dark-text dark:text-white">#{pr.number} {pr.title}</p>
                                        <p className="text-xs text-medium-dark-text dark:text-medium-text mt-1">by {pr.user.login}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-center h-full">
                            <div>
                                <GithubIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-white/10" />
                                <p className="mt-4 text-medium-dark-text dark:text-medium-text">{statusMessage || 'Select a repository or enter a PR URL to begin.'}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PushPullPanel;