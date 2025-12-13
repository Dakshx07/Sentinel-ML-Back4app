import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GithubIcon, ShieldIcon, ErrorIcon, SettingsIcon, HistoryIcon, CodeIcon, SpinnerIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon, SearchIcon, RepoIcon } from './icons';
import { parseGitHubUrl, getRepoCommits, getCommitDiff } from '../services/githubService';
import { analyzeCommitHistory, isApiKeySet } from '../services/geminiService';
import { GitHubCommit, CommitAnalysisIssue, User, Repository } from '../types';
import { useToast } from './ToastContext';
import AnalysisLoader from './AnalysisLoader';
import ToggleSwitch from './ToggleSwitch';
import { motion, AnimatePresence } from 'framer-motion';


type Tab = 'details' | 'analysis';

const CommitCard: React.FC<{ commit: GitHubCommit, issue: CommitAnalysisIssue | undefined, isSelected: boolean, onSelect: () => void }> = ({ commit, issue, isSelected, onSelect }) => {
    const firstLineOfMessage = commit.commit.message.split('\n')[0];
    const commitDate = new Date(commit.commit.author.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const severityColors: Record<string, { border: string; bg: string; text: string; shadow: string }> = {
        Critical: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' },
        High: { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]' },
        Medium: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400', shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]' },
        Low: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]' },
    };

    const colors = issue ? severityColors[issue.severity] : { border: 'border-white/5', bg: 'bg-transparent', text: 'text-gray-400', shadow: '' };

    return (
        <motion.div
            onClick={onSelect}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
            className={`p-4 border-l-2 rounded-r-xl transition-all cursor-pointer flex items-start space-x-3 mb-2 ${isSelected
                ? 'bg-blue-500/10 border-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]'
                : `${colors.bg} ${colors.border} hover:bg-white/5`
                }`}
        >
            <div className="flex-shrink-0 mt-1">
                {issue ? (
                    <ShieldIcon severity={issue.severity} className={`w-4 h-4 ${colors.text}`} />
                ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600 bg-gray-800/50" />
                )}
            </div>
            <div className="flex-grow overflow-hidden">
                <p className={`font-medium text-sm truncate ${issue ? 'text-white' : 'text-gray-300'}`} title={firstLineOfMessage}>
                    {firstLineOfMessage}
                </p>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                            {commit.commit.author.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-gray-500 truncate max-w-[80px]">{commit.commit.author.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-600">
                        <span className="bg-white/5 px-1.5 py-0.5 rounded">{commit.sha.substring(0, 7)}</span>
                        <span>{commitDate}</span>
                    </div>
                </div>
            </div>
        </motion.div>
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
            if (useManualInput) {
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
        if (selectedCommit) {
            const issueFound = issues.some(i => i.sha === selectedCommit.sha);
            setActiveTab(issueFound ? 'analysis' : 'details');
        }
    }, [selectedCommit, issues]);

    const selectedIssue = issues.find(issue => issue.sha === selectedCommit?.sha);

    const TabButton = ({ id, label, icon }: { id: Tab, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center py-4 text-sm font-bold uppercase tracking-wider transition-all relative overflow-hidden ${activeTab === id
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
        >
            <div className="flex items-center space-x-2 z-10">
                {icon}
                <span>{label}</span>
            </div>
            {activeTab === id && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                />
            )}
            {activeTab === id && (
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent" />
            )}
        </button>
    );

    const DiffViewer: React.FC<{ diff: string }> = ({ diff }) => {
        const highlightedDiff = useMemo(() => {
            if (window.hljs && diff) {
                try {
                    return window.hljs.highlight(diff, { language: 'diff', ignoreIllegals: true }).value;
                } catch (e) {
                    return diff;
                }
            }
            return diff;
        }, [diff]);

        return (
            <div className="mt-6 animate-fade-in-up">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
                    <CodeIcon className="w-4 h-4 mr-2" />
                    Code Changes
                </h3>
                <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                    <pre className="whitespace-pre-wrap p-4 text-xs font-mono text-gray-300 overflow-x-auto custom-scrollbar">
                        <code dangerouslySetInnerHTML={{ __html: highlightedDiff }} />
                    </pre>
                </div>
            </div>
        );
    };

    const MainContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full bg-black/20 backdrop-blur-sm">
                    <AnalysisLoader steps={['Fetching recent commits...', 'Analyzing commit history...', 'Checking for exposed secrets...', 'Compiling report...']} />
                </div>
            );
        }

        if (error) {
            return <ErrorMessage message={error} onNavigateToSettings={onNavigateToSettings} />;
        }

        if (!selectedCommit) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <HistoryIcon className="w-10 h-10 text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white font-heading">Scan Commit History</h3>
                    <p className="mt-3 text-gray-400 text-sm max-w-sm leading-relaxed">Select a commit from the list to view its details and security analysis.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm">
                <div className="flex border-b border-white/5 flex-shrink-0 bg-black/20">
                    <TabButton id="details" label="Details" icon={<CodeIcon className="w-4 h-4" />} />
                    <TabButton id="analysis" label={`Analysis ${selectedIssue ? '(1)' : '(0)'}`} icon={<ShieldIcon severity={selectedIssue?.severity || "Low"} className="w-4 h-4" />} />
                </div>
                <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'details' && (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                                {selectedCommit.commit.author.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold">{selectedCommit.commit.author.name}</h4>
                                                <p className="text-xs text-gray-400">{selectedCommit.commit.author.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">{selectedCommit.sha}</p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(selectedCommit.commit.author.date).toUTCString()}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-white/5 pt-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Commit Message</h3>
                                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedCommit.commit.message}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'analysis' && (
                            <motion.div
                                key="analysis"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {selectedIssue ? (
                                    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                                        <div className="flex items-start space-x-4 mb-6">
                                            <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                                                <ShieldIcon severity={selectedIssue.severity} className="w-6 h-6 text-orange-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-white font-heading">{selectedIssue.title}</h4>
                                                <p className="mt-1 text-gray-400 text-sm">{selectedIssue.description}</p>
                                            </div>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                                <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-2 text-blue-400">Summary</h5>
                                                <p className="text-sm text-gray-300 leading-relaxed">"{selectedIssue.plainLanguageSummary}"</p>
                                            </div>
                                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                                <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-2 text-purple-400">Reasoning</h5>
                                                <p className="text-sm text-gray-300 leading-relaxed">{selectedIssue.reasoning}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                                            <h5 className="font-bold text-green-400 text-xs uppercase tracking-wider mb-2">Remediation</h5>
                                            <p className="text-sm text-gray-300 leading-relaxed">{selectedIssue.remediation}</p>
                                        </div>

                                        {isDiffLoading && (
                                            <div className="flex items-center justify-center p-8">
                                                <SpinnerIcon className="w-6 h-6 text-blue-400 animate-spin" />
                                                <span className="ml-3 text-sm text-gray-400">Fetching diff...</span>
                                            </div>
                                        )}
                                        {commitDiff && !isDiffLoading && <DiffViewer diff={commitDiff} />}
                                    </div>
                                ) : (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
                                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ShieldIcon severity="Low" className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <h4 className="text-xl font-bold text-white mb-2">Clean Commit</h4>
                                        <p className="text-emerald-400/80">No security issues found in this commit.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        )
    }

    const ErrorMessage = ({ message, onNavigateToSettings }: { message: string, onNavigateToSettings: () => void }) => (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-black/20 backdrop-blur-sm">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <ErrorIcon className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-8">{message}</p>
            <motion.button
                onClick={onNavigateToSettings}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white text-black font-bold text-sm rounded-full flex items-center space-x-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
            >
                <SettingsIcon className="w-4 h-4" />
                <span>Configure Access</span>
            </motion.button>
        </div>
    );

    return (
        <div className="h-full w-full bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-fade-in-up">
            {/* Left Panel - Commit List */}
            <motion.div
                initial={false}
                animate={{ width: isCommitPanelCollapsed ? '4rem' : '22rem' }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="flex-shrink-0 bg-black/20 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col relative"
            >
                <div className="p-4 border-b border-white/5 flex-shrink-0">
                    {!isCommitPanelCollapsed && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Repository</h3>
                                <div className="flex items-center space-x-2">
                                    <span className="text-[10px] text-gray-500">Manual</span>
                                    <ToggleSwitch enabled={useManualInput} setEnabled={setUseManualInput} />
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    {useManualInput ? <SearchIcon className="h-4 w-4 text-gray-500" /> : <RepoIcon className="h-4 w-4 text-gray-500" />}
                                </div>
                                {useManualInput ? (
                                    <input
                                        type="text"
                                        value={manualRepoUrl}
                                        onChange={(e) => setManualRepoUrl(e.target.value)}
                                        placeholder="https://github.com/user/repo"
                                        className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono"
                                    />
                                ) : (
                                    <select
                                        value={selectedRepoFullName}
                                        onChange={(e) => setSelectedRepoFullName(e.target.value)}
                                        disabled={isLoading || repos.length === 0}
                                        className="block w-full pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        {repos.length > 0 ? repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>) : <option>Add a repo first</option>}
                                    </select>
                                )}
                            </div>

                            <motion.button
                                onClick={handleScanCommits}
                                disabled={isLoading || !user.github || !repoUrlToScan}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-2.5 bg-white text-black font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <><SpinnerIcon className="w-4 h-4 mr-2 animate-spin" /> Scanning...</>
                                ) : (
                                    'Scan History'
                                )}
                            </motion.button>
                        </div>
                    )}
                </div>
                <div className="flex-grow overflow-y-auto p-3 space-y-1 min-h-0 custom-scrollbar">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3">
                            <SpinnerIcon className="w-6 h-6 text-blue-400 animate-spin" />
                            <span className="text-xs text-gray-500">Analyzing commits...</span>
                        </div>
                    )}
                    {!isCommitPanelCollapsed && !isLoading && commits.length === 0 && (
                        <div className="text-center p-8 opacity-50">
                            <HistoryIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                            <p className="text-xs text-gray-500">No commits found</p>
                        </div>
                    )}
                    {!isCommitPanelCollapsed && commits.map(commit => (
                        <CommitCard
                            key={commit.sha}
                            commit={commit}
                            issue={issues.find(i => i.sha === commit.sha)}
                            isSelected={selectedCommit?.sha === commit.sha}
                            onSelect={() => setSelectedCommit(commit)}
                        />
                    ))}
                </div>
                <div className="p-3 border-t border-white/5">
                    <button
                        onClick={() => setIsCommitPanelCollapsed(!isCommitPanelCollapsed)}
                        className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                    >
                        {isCommitPanelCollapsed ? <DoubleArrowRightIcon className="w-4 h-4" /> : <DoubleArrowLeftIcon className="w-4 h-4" />}
                    </button>
                </div>
            </motion.div>
            <div className="flex-grow min-w-0 bg-black/20">
                <MainContent />
            </div>
        </div>
    );
};

export default CommitScanner;