

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GithubIcon, CodeIcon, ErrorIcon, SettingsIcon, SpinnerIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from './icons';
import { parseGitHubUrl, getRepoFileTree, getFileContent, createPullRequestForFix } from '../services/githubService';
import { GitHubTreeItem, AnalysisIssue, CodeFile, User, Repository } from '../types';
import { analyzeCode, isApiKeySet } from '../services/geminiService';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import { useToast } from './ToastContext';
import { addScan } from '../services/dbService';
import ToggleSwitch from './ToggleSwitch';
import AnalysisLoader from './AnalysisLoader';

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

    // FIX: Add state to track URL validity for more robust UI state.
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
            // FIX: Always show a toast on invalid URL, not just in manual mode. This was causing the button to do nothing silently.
            addToast("Invalid GitHub repository URL.", 'error');
            setScannerState('idle');
            return;
        }

        try {
            const tree = await getRepoFileTree(parsed.owner, parsed.repo);
            setFileTree(tree);
            setScannerState('idle'); // Set to idle so files can be selected
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

        // Set the state to indicate a fix is active and store original content
        setAppliedFix({ issue, originalContent: activeFile.content });

        // Apply the fix to the code content in the editor
        const lines = activeFile.content.split('\n');
        lines.splice(issue.line - 1, 1, ...issue.suggestedFix.split('\n'));
        const newContent = lines.join('\n');
        setActiveFile({ ...activeFile, content: newContent, isModified: true });

        // Keep the issue selected so its card stays open to show the new buttons
        setSelectedIssue(issue);

        addToast("Fix applied locally. Commit to create a PR.", 'info');
    };

    const handleRevertFix = () => {
        if (!appliedFix || !activeFile) return;

        // Revert the code content in the editor
        setActiveFile({ ...activeFile, content: appliedFix.originalContent, isModified: false });

        // Keep the issue selected
        setSelectedIssue(appliedFix.issue);

        // Clear the active fix state
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
        <div className="h-full w-full glass-effect rounded-lg overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row">
            <div
                className="flex-shrink-0 bg-light-secondary/50 dark:bg-dark-secondary/50 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/10 flex flex-col transition-all duration-300 ease-in-out w-full"
                style={{ width: isFilePanelCollapsed ? '3.5rem' : '', flexBasis: isFilePanelCollapsed ? 'auto' : '25%' }}
            >
                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0 overflow-hidden">
                    {!isFilePanelCollapsed && (
                        <>
                            <div className="relative">
                                <GithubIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-medium-dark-text dark:text-medium-text" />
                                {useManualInput ? (
                                    <input type="text" value={manualRepoUrl} onChange={(e) => setManualRepoUrl(e.target.value)} placeholder="https://github.com/user/repo" className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-2 pl-10 font-mono text-sm" />
                                ) : (
                                    <select value={selectedRepoFullName} onChange={(e) => setSelectedRepoFullName(e.target.value)} disabled={scannerState !== 'idle' || repos.length === 0} className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-2 pl-10 font-mono text-sm">
                                        {repos.length > 0 ? repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>) : <option>Add a repo first</option>}
                                    </select>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                                <div className="flex items-center space-x-2">
                                    <ToggleSwitch enabled={useManualInput} setEnabled={setUseManualInput} />
                                    <span className="text-xs text-medium-dark-text dark:text-medium-text">Enter Manually</span>
                                </div>
                                <button
                                    onClick={() => handleScanRepo(repoUrlToScan)}
                                    disabled={scannerState !== 'idle' || !isRepoUrlValid}
                                    className="btn-primary py-2 px-4 disabled:opacity-50 w-28 text-center"
                                >
                                    {scannerState === 'loading_repo' ? <SpinnerIcon className="w-5 h-5 mx-auto" /> : 'Scan Repo'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-1 min-h-0">
                    {scannerState === 'loading_repo' && <div className="p-4 flex justify-center"><SpinnerIcon className="w-6 h-6" /></div>}
                    {!isFilePanelCollapsed && fileTree.map(file => (
                        <button key={file.path} onClick={() => handleFileSelect(file)} disabled={scannerState !== 'idle'}
                            className={`w-full flex items-center space-x-2 p-2 rounded-md text-left text-sm ${activeFile?.name === file.path ? 'bg-brand-purple/20' : 'hover:bg-gray-200 dark:hover:bg-white/5'}`}
                        >
                            <CodeIcon className="w-4 h-4 text-medium-dark-text dark:text-medium-text flex-shrink-0" />
                            <span className="truncate">{file.path}</span>
                        </button>
                    ))}
                </div>
                <div className="p-1 border-t border-gray-200 dark:border-white/10">
                    <button onClick={() => setIsFilePanelCollapsed(!isFilePanelCollapsed)} className="w-full p-2 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-dark-primary text-medium-dark-text dark:text-medium-text" title={isFilePanelCollapsed ? "Expand" : "Collapse"}>
                        {isFilePanelCollapsed ? <DoubleArrowRightIcon className="w-5 h-5" /> : <DoubleArrowLeftIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            <div className="flex-grow min-w-0 w-full lg:w-auto">
                <CenterPanel activeFile={activeFile} issues={issues} selectedIssue={selectedIssue} fixDiff={fixDiff} isLoading={scannerState === 'analyzing'} />
            </div>
            <div className="w-full lg:w-1/3 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/10">
                {scannerState === 'setup_required' ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <ErrorIcon className="w-12 h-12 text-yellow-500 mb-4" />
                        <h3 className="text-lg font-bold">Setup Required</h3>
                        <p className="mt-2 text-medium-dark-text dark:text-medium-text max-w-sm">Please set your Gemini API Key and connect to GitHub in Settings.</p>
                        <button onClick={onNavigateToSettings} className="mt-6 flex items-center justify-center btn-primary">
                            <SettingsIcon className="w-5 h-5 mr-2" /> Go to Settings
                        </button>
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