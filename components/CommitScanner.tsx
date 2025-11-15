import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GithubIcon, ShieldIcon, ErrorIcon, SettingsIcon, HistoryIcon, CodeIcon, SpinnerIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from './icons';
import { parseGitHubUrl, getRepoCommits, getCommitDiff } from '../services/githubService';
import { analyzeCommitHistory, isApiKeySet } from '../services/geminiService';
import { GitHubCommit, CommitAnalysisIssue, User, Repository } from '../types';
import { useToast } from './ToastContext';
import AnalysisLoader from './AnalysisLoader';
import ToggleSwitch from './ToggleSwitch';


type Tab = 'details' | 'analysis';

const CommitCard: React.FC<{ commit: GitHubCommit, issue: CommitAnalysisIssue | undefined, isSelected: boolean, onSelect: () => void }> = ({ commit, issue, isSelected, onSelect }) => {
    const firstLineOfMessage = commit.commit.message.split('\n')[0];
    const commitDate = new Date(commit.commit.author.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const severityClass = issue ? {
        Critical: 'border-red-500/80',
        High: 'border-orange-500/80',
        Medium: 'border-yellow-400/80',
        Low: 'border-blue-400/80',
    }[issue.severity] : 'border-gray-200 dark:border-white/10';

    return (
        <div
            onClick={onSelect}
            className={`p-3 border-l-4 rounded-r-md transition-all cursor-pointer flex items-start space-x-3 bg-light-primary dark:bg-dark-primary ${isSelected ? 'bg-brand-purple/20 border-brand-purple' : `${severityClass} hover:bg-gray-200 dark:hover:bg-white/5`}`}
        >
            {issue && <ShieldIcon severity={issue.severity} className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <div className="flex-grow overflow-hidden">
                <p className={`font-semibold text-dark-text dark:text-white truncate ${issue ? 'text-orange-500 dark:text-orange-400' : ''}`} title={firstLineOfMessage}>
                    {firstLineOfMessage}
                </p>
                <div className="text-xs text-medium-dark-text dark:text-medium-text mt-1 flex items-center space-x-2 flex-wrap">
                    <span className="truncate">{commit.commit.author.name}</span>
                    <span className="font-mono">{commit.sha.substring(0, 7)}</span>
                    <span>{commitDate}</span>
                </div>
            </div>
        </div>
    );
};

interface CommitScannerProps {
    user: User;
    onNavigateToSettings: () => void;
    repos: Repository[];
}

const CommitScanner: React.FC<CommitScannerProps> = ({ user, onNavigateToSettings, repos }) => {
    const [manualRepoUrl, setManualRepoUrl] = useState('https://github.com/OWASP/wrongsecrets');
    const [selectedRepoFullName, setSelectedRepoFullName] = useState('');
    const [useManualInput, setUseManualInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [commits, setCommits] = useState<GitHubCommit[]>([]);
    const [issues, setIssues] = useState<CommitAnalysisIssue[]>([]);
    const [selectedCommit, setSelectedCommit] = useState<GitHubCommit | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('details');
    const { addToast } = useToast();
    const [error, setError] = useState<string | null>(null);
    const [commitDiff, setCommitDiff] = useState<string | null>(null);
    const [isDiffLoading, setIsDiffLoading] = useState(false);
    const [isCommitPanelCollapsed, setIsCommitPanelCollapsed] = useState(false);
    
    const repoUrlToScan = useMemo(() => {
        return useManualInput ? manualRepoUrl : `https://github.com/${selectedRepoFullName}`;
    }, [useManualInput, manualRepoUrl, selectedRepoFullName]);

    useEffect(() => {
        if (repos.length > 0 && !selectedRepoFullName) {
            setSelectedRepoFullName(repos[0].full_name);
        }
    }, [repos, selectedRepoFullName]);
    
    useEffect(() => {
        const fetchDiff = async () => {
            if (!selectedCommit) {
                setCommitDiff(null);
                return;
            }

            const issueForCommit = issues.find(i => i.sha === selectedCommit.sha);
            if (!issueForCommit) {
                setCommitDiff(null);
                return;
            }

            const parsed = parseGitHubUrl(repoUrlToScan);
            if (!parsed) return;

            setIsDiffLoading(true);
            try {
                const diff = await getCommitDiff(parsed.owner, parsed.repo, selectedCommit.sha);
                setCommitDiff(diff);
            } catch (e: any) {
                addToast(e.message || 'Failed to fetch commit diff.', 'error');
                setCommitDiff(null);
            } finally {
                setIsDiffLoading(false);
            }
        };

        fetchDiff();
    }, [selectedCommit, repoUrlToScan, addToast, issues]);


    const handleScanCommits = useCallback(async () => {
        setError(null);
        if (!user.github) {
            setError("Please connect your GitHub account in Settings to use the Commit Scanner.");
            return;
        }
        if (!isApiKeySet()) {
            setError("Please set your Gemini API key in Settings to analyze commits.");
            return;
        }
        
        const parsed = parseGitHubUrl(repoUrlToScan);
        if (!parsed) {
            if(useManualInput) {
                addToast("Invalid GitHub repository URL.", 'error');
            }
            return;
        }

        setIsLoading(true);
        setCommits([]);
        setIssues([]);
        setSelectedCommit(null);

        try {
            const fetchedCommits = await getRepoCommits(parsed.owner, parsed.repo);
            setCommits(fetchedCommits);
            
            if (fetchedCommits.length > 0) {
                const analysisResults = await analyzeCommitHistory(fetchedCommits);

                const fetchedCommitShas = new Set(fetchedCommits.map(c => c.sha));
                const validatedResults = analysisResults.filter(issue => fetchedCommitShas.has(issue.sha));

                if (analysisResults.length !== validatedResults.length) {
                    console.warn("AI returned issues for SHAs that were not in the original commit list. These have been filtered out.");
                }

                setIssues(validatedResults);
                addToast(`Analysis complete! Found ${validatedResults.length} potential issue(s).`, 'success');
                
                if (validatedResults.length > 0) {
                    const firstCommitWithIssue = fetchedCommits.find(c => validatedResults.some(i => i.sha === c.sha));
                    if (firstCommitWithIssue) {
                        setSelectedCommit(firstCommitWithIssue);
                    }
                }
            } else {
                 addToast(`No commits found for the default branch of ${parsed.owner}/${parsed.repo}.`, 'warning');
            }
            
        } catch (e: any) {
            const errorMessage = e.message || "An unknown error occurred during the scan.";
            setError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [repoUrlToScan, user.github, addToast, useManualInput]);
    
    useEffect(() => {
        if (!useManualInput && selectedRepoFullName && user.github) {
            handleScanCommits();
        }
    }, [useManualInput, selectedRepoFullName, handleScanCommits, user.github]);

    useEffect(() => {
        if(selectedCommit){
            const issueFound = issues.some(i => i.sha === selectedCommit.sha);
            setActiveTab(issueFound ? 'analysis' : 'details');
        }
    }, [selectedCommit, issues]);

    const selectedIssue = issues.find(issue => issue.sha === selectedCommit?.sha);

    const TabButton = ({ id, label, icon }: {id: Tab, label: string, icon: React.ReactNode}) => (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex-1 flex items-center justify-center p-3 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? 'text-brand-purple border-brand-purple' : 'text-medium-dark-text dark:text-medium-text border-transparent hover:bg-gray-100 dark:hover:bg-white/5'}`}
      >
        {icon}
        <span className="ml-2">{label}</span>
      </button>
    );
    
    const DiffViewer: React.FC<{ diff: string }> = ({ diff }) => {
        const highlightedDiff = useMemo(() => {
            if (window.hljs && diff) {
                try {
                    return window.hljs.highlight(diff, { language: 'diff', ignoreIllegals: true }).value;
                } catch (e) {
                    return diff; // Fallback
                }
            }
            return diff;
        }, [diff]);

        return (
            <div className="mt-4">
                <h3 className="text-lg font-bold text-dark-text dark:text-white font-heading mb-2">Code Changes in Commit</h3>
                <pre className="whitespace-pre-wrap bg-light-primary dark:bg-dark-primary p-4 rounded-md text-sm font-mono border border-gray-200 dark:border-white/10">
                    <code dangerouslySetInnerHTML={{ __html: highlightedDiff }} />
                </pre>
            </div>
        );
    };

    const MainContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full bg-light-secondary dark:bg-dark-primary">
                    <AnalysisLoader steps={['Fetching recent commits...', 'Analyzing commit history...', 'Checking for exposed secrets...', 'Compiling report...']} />
                </div>
            );
        }

        if (error) {
             return <ErrorMessage message={error} onNavigateToSettings={onNavigateToSettings} />;
        }

        if (!selectedCommit) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center text-medium-dark-text dark:text-medium-text p-4">
                    <HistoryIcon className="w-16 h-16 mb-4 text-gray-300 dark:text-white/10"/>
                    <h3 className="text-lg font-bold text-dark-text dark:text-light-text font-heading">Scan Commit History</h3>
                    <p className="mt-1 max-w-xs">Select a commit from the list to view its details and security analysis.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full bg-light-secondary dark:bg-dark-primary">
                <div className="flex border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                    <TabButton id="details" label="Details" icon={<CodeIcon className="w-5 h-5"/>}/>
                    <TabButton id="analysis" label={`AI Analysis ${selectedIssue ? '(1)' : '(0)'}`} icon={<ShieldIcon severity={selectedIssue?.severity || "Low"} className="w-5 h-5"/>}/>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div>
                                <p className="font-mono text-sm text-medium-dark-text dark:text-medium-text"> commit <span className="text-yellow-600 dark:text-yellow-400">{selectedCommit.sha}</span></p>
                                <p className="text-sm text-medium-dark-text dark:text-medium-text mt-1"> Author: {selectedCommit.commit.author.name} &lt;{selectedCommit.commit.author.email}&gt; </p>
                                <p className="text-sm text-medium-dark-text dark:text-medium-text"> Date: {new Date(selectedCommit.commit.author.date).toUTCString()} </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-dark-text dark:text-white font-heading mb-2">Commit Message</h3>
                                <pre className="whitespace-pre-wrap bg-light-primary dark:bg-dark-secondary p-4 rounded-md text-sm font-mono text-dark-text dark:text-light-text border border-gray-200 dark:border-white/10">{selectedCommit.commit.message}</pre>
                            </div>
                        </div>
                    )}
                    {activeTab === 'analysis' && (
                         <>
                            {selectedIssue ? (
                                <div className="p-4 border-l-4 rounded-r-md border-orange-500 bg-orange-100 dark:bg-orange-900/20 space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <ShieldIcon severity={selectedIssue.severity} className="w-6 h-6 flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="font-bold text-lg text-dark-text dark:text-white">{selectedIssue.title}</h4>
                                            <p className="mt-1 text-medium-dark-text dark:text-light-text">{selectedIssue.description}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-white/10 pt-3">
                                        <h5 className="font-semibold text-dark-text dark:text-white text-base">Plain Language Summary</h5>
                                        <p className="text-sm text-medium-dark-text dark:text-medium-text mt-1 italic">"{selectedIssue.plainLanguageSummary}"</p>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-dark-text dark:text-white">Reasoning</h5>
                                        <p className="text-sm text-medium-dark-text dark:text-medium-text mt-1">{selectedIssue.reasoning}</p>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-dark-text dark:text-white">Suggested Remediation</h5>
                                        <p className="text-sm text-medium-dark-text dark:text-medium-text mt-1">{selectedIssue.remediation}</p>
                                    </div>
                                     {isDiffLoading && (
                                        <div className="flex items-center justify-center p-4">
                                            <SpinnerIcon className="w-6 h-6" />
                                            <span className="ml-2">Loading diff...</span>
                                        </div>
                                    )}
                                    {commitDiff && !isDiffLoading && <DiffViewer diff={commitDiff} />}
                                </div>
                            ) : (
                                <div className="p-4 border-l-4 rounded-r-md border-green-500 bg-green-100 dark:bg-green-900/20">
                                    <h4 className="font-bold text-lg text-dark-text dark:text-white">No security issues found by Sentinel in this commit.</h4>
                                </div>
                            )}
                         </>
                    )}
                </div>
            </div>
        )
    }
    
    const ErrorMessage = ({ message, onNavigateToSettings }: { message: string, onNavigateToSettings: () => void }) => (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-light-secondary dark:bg-dark-primary">
            <ErrorIcon className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-bold text-dark-text dark:text-white font-heading">An Error Occurred</h3>
            <p className="mt-2 text-medium-dark-text dark:text-medium-text max-w-sm">{message}</p>
            <button onClick={onNavigateToSettings} className="mt-6 flex items-center justify-center btn-primary">
                <SettingsIcon className="w-5 h-5 mr-2" /> Go to Settings
            </button>
        </div>
    );

    return (
        <div className="h-full w-full glass-effect rounded-lg overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row">
            <div 
                className="flex-shrink-0 bg-light-secondary/50 dark:bg-dark-secondary/50 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/10 flex flex-col transition-all duration-300 ease-in-out w-full lg:w-5/12"
                style={{ width: isCommitPanelCollapsed ? '3.5rem' : '' }}
            >
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0 overflow-hidden">
                     {!isCommitPanelCollapsed && (
                        <>
                            <div className="relative">
                                <GithubIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-medium-dark-text dark:text-medium-text" />
                                {useManualInput ? (
                                    <input type="text" value={manualRepoUrl} onChange={(e) => setManualRepoUrl(e.target.value)} placeholder="https://github.com/user/repo"
                                        className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-2 pl-10 font-mono text-sm text-dark-text dark:text-light-text focus:outline-none focus:ring-2 focus:ring-brand-purple"
                                    />
                                ) : (
                                    <select 
                                        value={selectedRepoFullName} 
                                        onChange={(e) => setSelectedRepoFullName(e.target.value)} 
                                        disabled={isLoading || repos.length === 0}
                                        className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-2 pl-10 font-mono text-sm text-dark-text dark:text-light-text focus:outline-none focus:ring-2 focus:ring-brand-purple"
                                    >
                                        {repos.length > 0 ? repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>) : <option>Add a repo first</option>}
                                    </select>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                                <div className="flex items-center space-x-2">
                                    <ToggleSwitch enabled={useManualInput} setEnabled={setUseManualInput} />
                                    <span className="text-xs text-medium-dark-text dark:text-medium-text">Enter Manually</span>
                                </div>
                                <button onClick={handleScanCommits} disabled={isLoading || !user.github || !repoUrlToScan} className="btn-primary py-2 px-4 disabled:opacity-50">
                                    {isLoading ? 'Scanning...' : 'Scan Commits'}
                                </button>
                            </div>
                        </>
                     )}
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-2 min-h-0">
                    {isLoading && <div className="p-2 text-medium-dark-text dark:text-medium-text flex items-center justify-center pt-8"><SpinnerIcon className="w-8 h-8"/></div>}
                    {!isCommitPanelCollapsed && !isLoading && commits.length === 0 && <p className="text-center text-medium-dark-text dark:text-medium-text pt-8">Scan a repository to see its commit history.</p>}
                    {!isCommitPanelCollapsed && commits.map(commit => (
                        <CommitCard key={commit.sha} commit={commit} issue={issues.find(i => i.sha === commit.sha)}
                            isSelected={selectedCommit?.sha === commit.sha} onSelect={() => setSelectedCommit(commit)}
                        />
                    ))}
                </div>
                 <div className="p-1 border-t border-gray-200 dark:border-white/10">
                    <button onClick={() => setIsCommitPanelCollapsed(!isCommitPanelCollapsed)} className="w-full p-2 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-dark-primary text-medium-dark-text dark:text-medium-text" title={isCommitPanelCollapsed ? "Expand" : "Collapse"}>
                        {isCommitPanelCollapsed ? <DoubleArrowRightIcon className="w-5 h-5" /> : <DoubleArrowLeftIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            <div className="flex-grow min-w-0">
                <MainContent />
            </div>
        </div>
    );
};

export default CommitScanner;