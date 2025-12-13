import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GithubIcon, CodeIcon, ErrorIcon, SettingsIcon, SpinnerIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon, SearchIcon, RepoIcon } from './icons';
import { parseGitHubUrl, getRepoFileTree, getFileContent, createPullRequestForFix } from '../services/githubService';
import { GitHubTreeItem, AnalysisIssue, CodeFile, User, Repository } from '../types';
import { analyzeCode, isApiKeySet } from '../services/geminiService';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import { useToast } from './ToastContext';
import { addScan } from '../services/dbService';
import ToggleSwitch from './ToggleSwitch';
import AnalysisLoader from './AnalysisLoader';
import { motion, AnimatePresence } from 'framer-motion';

type ScannerState = 'idle' | 'setup_required' | 'loading_repo' | 'analyzing' | 'error' | 'committing';

const getLanguage = (filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const extensionMap: { [key: string]: string } = {
        'py': 'python', 'ts': 'typescript', 'tsx': 'typescript',
        'js': 'typescript', 'jsx': 'javascript', 'tf': 'hcl', 'hcl': 'hcl',
    };
    return extensionMap[extension || ''] || 'plaintext';
};


interface GitHubScannerProps {
    user: User;
    onNavigateToSettings: () => void;
    repos: Repository[];
}

const GitHubScanner: React.FC<GitHubScannerProps> = ({ user, onNavigateToSettings, repos }) => {
    const [manualRepoUrl, setManualRepoUrl] = useState('https://github.com/OWASP/wrongsecrets');
    const [selectedRepoFullName, setSelectedRepoFullName] = useState('');
    const [useManualInput, setUseManualInput] = useState(false);
    const [scannerState, setScannerState] = useState<ScannerState>('idle');
    const [fileTree, setFileTree] = useState<GitHubTreeItem[]>([]);
    const [activeFile, setActiveFile] = useState<(CodeFile & { isModified?: boolean, sha: string }) | null>(null);
    const [issues, setIssues] = useState<AnalysisIssue[]>([]);
    const [selectedIssue, setSelectedIssue] = useState<AnalysisIssue | null>(null);
    const [fixDiff, setFixDiff] = useState<string | null>(null);
    const { addToast } = useToast();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [analyzingFile, setAnalyzingFile] = useState<string | null>(null);
    const [appliedFix, setAppliedFix] = useState<{ issue: AnalysisIssue; originalContent: string } | null>(null);
    const [isFilePanelCollapsed, setIsFilePanelCollapsed] = useState(false);

    const [isRepoUrlValid, setIsRepoUrlValid] = useState(false);

    const repoUrlToScan = useMemo(() => {
        return useManualInput ? manualRepoUrl : `https://github.com/${selectedRepoFullName}`;
    }, [useManualInput, manualRepoUrl, selectedRepoFullName]);

    useEffect(() => {
        setIsRepoUrlValid(!!parseGitHubUrl(repoUrlToScan));
    }, [repoUrlToScan]);

    const handleFileSelect = useCallback(async (file: GitHubTreeItem) => {
        setScannerState('analyzing');
        setActiveFile(null);
        setIssues([]);
        setSelectedIssue(null);
        setAppliedFix(null);
        setAnalyzingFile(file.path);

        const parsed = parseGitHubUrl(repoUrlToScan);
        if (!parsed) return;

        try {
            const content = await getFileContent(parsed.owner, parsed.repo, file.path);
            const language = getLanguage(file.path);
            setActiveFile({ name: file.path, language, content, sha: file.sha });

            const results = await analyzeCode(content, language);
            const validatedResults = results.map(issue => ({ ...issue, filePath: file.path }));
            setIssues(validatedResults);

            await addScan({
                repoFullName: repoUrlToScan,
                filePath: file.path,
                timestamp: Date.now(),
                issues: validatedResults,
                status: 'open',
                source: 'gitops'
            });

            if (validatedResults.length > 0) {
                const sortedResults = [...validatedResults].sort((a, b) =>
                    ['Critical', 'High', 'Medium', 'Low'].indexOf(a.severity) -
                    ['Critical', 'High', 'Medium', 'Low'].indexOf(b.severity)
                );
                setSelectedIssue(sortedResults[0]);
                addToast(`Found ${validatedResults.length} issues in ${file.path}`, 'info');
            } else {
                addToast(`No issues found in ${file.path}`, 'success');
            }
        } catch (e: any) {
            setErrorMessage(e.message);
            addToast(e.message, 'error');
            setScannerState('error');
        } finally {
            setScannerState('idle');
            setAnalyzingFile(null);
        }
    }, [repoUrlToScan, addToast]);

    const handleScanRepo = useCallback(async (url: string, filePathToSelect?: string) => {
        setScannerState('loading_repo');
        setErrorMessage(null);
        setFileTree([]);
        setActiveFile(null);
        setIssues([]);
        setSelectedIssue(null);
        setAppliedFix(null);

        if (!user.github || !isApiKeySet()) {
            setScannerState('setup_required');
            return;
        }

        const parsed = parseGitHubUrl(url);
        if (!parsed) {
            addToast("Invalid GitHub repository URL.", 'error');
            setScannerState('idle');
            return;
        }

        try {
            const tree = await getRepoFileTree(parsed.owner, parsed.repo);
            setFileTree(tree);
            setScannerState('idle');
            if (filePathToSelect) {
                const fileToSelect = tree.find(f => f.path === filePathToSelect);
                if (fileToSelect) {
                    await handleFileSelect(fileToSelect);
                } else {
                    addToast(`File '${filePathToSelect}' not found in repo.`, 'warning');
                }
            }
        } catch (e: any) {
            setErrorMessage(e.message);
            addToast(e.message, 'error');
            setScannerState('error');
        }
    }, [addToast, user, handleFileSelect]);

    useEffect(() => {
        const preloaded = localStorage.getItem('sentinel-gitops-preload');
        if (preloaded) {
            try {
                const { repoUrl, filePath } = JSON.parse(preloaded);
                setUseManualInput(true);
                setManualRepoUrl(repoUrl);
                handleScanRepo(repoUrl, filePath);
                localStorage.removeItem('sentinel-gitops-preload');
            } catch (e) {
                console.error("Failed to parse preloaded data", e);
            }
        } else if (repos.length > 0 && !selectedRepoFullName) {
            setSelectedRepoFullName(repos[0].full_name);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repos]);

    useEffect(() => {
        if (!useManualInput && selectedRepoFullName) {
            handleScanRepo(repoUrlToScan);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useManualInput, selectedRepoFullName]);

    useEffect(() => {
        if (selectedIssue && activeFile && !appliedFix) {
            const originalCodeLines = activeFile.content.split('\n');
            const lineIndex = selectedIssue.line - 1;
            if (lineIndex < 0 || lineIndex >= originalCodeLines.length) {
                setFixDiff(null); return;
            }
            const oldLine = originalCodeLines[lineIndex];
            const newLines = selectedIssue.suggestedFix.trim().split('\n');
            const diffText = `-${oldLine.trim()}\n` + newLines.map(l => `+${l}`).join('\n');
            setFixDiff(diffText);
        } else {
            setFixDiff(null);
        }
    }, [selectedIssue, activeFile, appliedFix]);

    const handleApplyFix = (issue: AnalysisIssue) => {
        if (!activeFile) return;
        setAppliedFix({ issue, originalContent: activeFile.content });
        const lines = activeFile.content.split('\n');
        lines.splice(issue.line - 1, 1, ...issue.suggestedFix.split('\n'));
        const newContent = lines.join('\n');
        setActiveFile({ ...activeFile, content: newContent, isModified: true });
        setSelectedIssue(issue);
        addToast("Fix applied locally. Commit to create a PR.", 'info');
    };

    const handleRevertFix = () => {
        if (!appliedFix || !activeFile) return;
        setActiveFile({ ...activeFile, content: appliedFix.originalContent, isModified: false });
        setSelectedIssue(appliedFix.issue);
        setAppliedFix(null);
        addToast("Fix reverted.", 'info');
    };

    const handleCommitFix = async () => {
        if (!appliedFix || !activeFile || !repoUrlToScan) return;
        setScannerState('committing');
        const parsed = parseGitHubUrl(repoUrlToScan);
        if (!parsed) return;
        try {
            const prUrl = await createPullRequestForFix(
                parsed.owner, parsed.repo, activeFile.name, activeFile.content, activeFile.sha,
                `fix(security): Apply Sentinel AI fix for ${appliedFix.issue.title}`,
                `Sentinel AI Fix: ${appliedFix.issue.title}`,
                `Resolves: ${appliedFix.issue.title}\n\n${appliedFix.issue.description}\n\n**Suggested Fix:**\n\`\`\`${activeFile.language}\n${appliedFix.issue.suggestedFix}\n\`\`\``
            );
            addToast(<span>PR created successfully! <a href={prUrl} target="_blank" rel="noopener noreferrer" className="underline">View Pull Request</a></span>, 'success');
            setActiveFile({ ...activeFile, isModified: false });
            setAppliedFix(null);
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setScannerState('idle');
        }
    };

    return (
        <div className="h-full w-full bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-fade-in-up">
            {/* Left Panel - File Tree */}
            <motion.div
                initial={false}
                animate={{ width: isFilePanelCollapsed ? '4rem' : '20rem' }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="flex-shrink-0 bg-black/20 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col relative"
            >
                <div className="p-4 border-b border-white/5 flex-shrink-0">
                    {!isFilePanelCollapsed && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target Repository</h3>
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
                                        disabled={scannerState !== 'idle' || repos.length === 0}
                                        className="block w-full pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        {repos.length > 0 ? repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>) : <option>Add a repo first</option>}
                                    </select>
                                )}
                            </div>

                            <motion.button
                                onClick={() => handleScanRepo(repoUrlToScan)}
                                disabled={scannerState !== 'idle' || !isRepoUrlValid}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-2.5 bg-white text-black font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center"
                            >
                                {scannerState === 'loading_repo' ? (
                                    <><SpinnerIcon className="w-4 h-4 mr-2 animate-spin" /> Fetching Tree...</>
                                ) : (
                                    'Scan Repository'
                                )}
                            </motion.button>
                        </div>
                    )}
                </div>

                {/* File List */}
                <div className="flex-grow overflow-y-auto p-2 space-y-1 min-h-0 custom-scrollbar">
                    {scannerState === 'loading_repo' && (
                        <div className="flex flex-col items-center justify-center h-40 space-y-3">
                            <SpinnerIcon className="w-6 h-6 text-blue-400 animate-spin" />
                            <span className="text-xs text-gray-500">Indexing files...</span>
                        </div>
                    )}
                    {!isFilePanelCollapsed && fileTree.map(file => (
                        <motion.button
                            key={file.path}
                            onClick={() => handleFileSelect(file)}
                            disabled={scannerState !== 'idle'}
                            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                            className={`w-full flex items-center space-x-3 p-2.5 rounded-lg text-left text-xs transition-all group ${activeFile?.name === file.path
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'text-gray-400 border border-transparent'
                                }`}
                        >
                            <CodeIcon className={`w-4 h-4 flex-shrink-0 ${activeFile?.name === file.path ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-300'}`} />
                            <span className="truncate font-mono">{file.path}</span>
                        </motion.button>
                    ))}
                </div>

                {/* Collapse Button */}
                <div className="p-3 border-t border-white/5">
                    <button
                        onClick={() => setIsFilePanelCollapsed(!isFilePanelCollapsed)}
                        className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                    >
                        {isFilePanelCollapsed ? <DoubleArrowRightIcon className="w-4 h-4" /> : <DoubleArrowLeftIcon className="w-4 h-4" />}
                    </button>
                </div>
            </motion.div>

            {/* Center Panel - Code Editor */}
            <div className="flex-grow min-w-0 w-full lg:w-auto bg-black/20">
                <CenterPanel activeFile={activeFile} issues={issues} selectedIssue={selectedIssue} fixDiff={fixDiff} isLoading={scannerState === 'analyzing'} />
            </div>

            {/* Right Panel - Issues */}
            <div className="w-full lg:w-96 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 bg-black/30 backdrop-blur-md">
                {scannerState === 'setup_required' ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <ErrorIcon className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
                        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">System requires valid API credentials and GitHub authentication to proceed.</p>
                        <motion.button
                            onClick={onNavigateToSettings}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-8 px-6 py-3 bg-white text-black font-bold text-sm rounded-full flex items-center space-x-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
                        >
                            <SettingsIcon className="w-4 h-4" />
                            <span>Configure Access</span>
                        </motion.button>
                    </div>
                ) : (
                    <RightPanel
                        issues={issues}
                        isLoading={scannerState === 'loading_repo'}
                        selectedIssue={selectedIssue}
                        setSelectedIssue={setSelectedIssue}
                        onApplyFix={handleApplyFix}
                        appliedIssue={appliedFix ? appliedFix.issue : null}
                        onCommitFix={handleCommitFix}
                        onRevertFix={handleRevertFix}
                        isCommitting={scannerState === 'committing'}
                        progressText={analyzingFile ? `Analyzing ${analyzingFile}` : 'Fetching repo file tree...'}
                    />
                )}
            </div>
        </div>
    );
};
export default GitHubScanner;