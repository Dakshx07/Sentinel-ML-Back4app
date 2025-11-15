import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from './ToastContext';
import { BrainCircuitIcon, ErrorIcon, SettingsIcon, SpinnerIcon, GithubIcon, CodeIcon } from './icons';
import { isApiKeySet, refactorCode } from '../services/geminiService';
import { createPullRequestForFix, getRepoFileTree, getFileContent, parseGitHubUrl } from '../services/githubService';
import { RefactorResult, Repository, User, GitHubTreeItem } from '../types';

// New imports for the redesigned component
import { useTheme } from './ThemeContext';
import CodeMirror, { EditorView, ViewUpdate } from '@uiw/react-codemirror';
import { atomone } from '@uiw/codemirror-theme-atomone';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { ViewPlugin, Decoration, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { diff_match_patch as DiffMatchPatch, Diff } from 'diff-match-patch';
import { motion, AnimatePresence } from 'framer-motion';

const getLanguageFromFile = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
        py: 'python', ts: 'typescript', tsx: 'typescript',
        js: 'javascript', jsx: 'javascript', hcl: 'hcl', tf: 'hcl',
        json: 'json'
    };
    return langMap[ext || ''] || 'plaintext';
};

const getCodeMirrorLanguage = (lang: string) => {
    if (lang === 'python') return python();
    if (['typescript', 'javascript', 'json'].includes(lang)) {
        return javascript({ jsx: true, typescript: true });
    }
    // Fallback to javascript for any other language to ensure some highlighting
    return javascript({ jsx: true, typescript: true });
};


// --- START: CodeMirror Diff Highlighting Extension ---
function createLineDiffExtension(lineDiffs: Diff[], isOriginal: boolean) {
    const relevantOp = isOriginal ? -1 : 1; // -1 for original (deletions), 1 for refactored (insertions)
    const decoClass = isOriginal ? 'cm-line-delete' : 'cm-line-insert';
    const deco = Decoration.line({ class: decoClass });

    return ViewPlugin.fromClass(class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view);
        }
        
        // This is intentionally left empty. The extension is re-created via useMemo when diffs change,
        // which is sufficient for this use case and simpler than handling dynamic updates.
        update(update: ViewUpdate) {}

        buildDecorations(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>();
            let lineNumber = 1;
            for (const [op, text] of lineDiffs) {
                // diff-match-patch can return text without a trailing newline.
                // This logic correctly counts the number of lines in the diff segment.
                const numLines = text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
                if (numLines === 0) continue;

                if (op === relevantOp) {
                    for (let i = 0; i < numLines; i++) {
                        const currentLine = lineNumber + i;
                        if (currentLine <= view.state.doc.lines) {
                           const line = view.state.doc.line(currentLine);
                           builder.add(line.from, line.from, deco);
                        }
                    }
                }

                // Advance line counter for operations that exist in this view
                if (op !== (isOriginal ? 1 : -1)) { // op is EQUAL or DELETE for original, EQUAL or INSERT for refactored
                    lineNumber += numLines;
                }
            }
            return builder.finish();
        }
    }, {
        decorations: v => v.decorations
    });
}
// --- END: CodeMirror Diff Highlighting Extension ---


type AgentState = 'idle' | 'loading_files' | 'file_selected' | 'refactoring' | 'refactor_done' | 'creating_pr';
type ViewMode = 'side-by-side' | 'original' | 'refactored';

interface RefactorSimulatorProps {
    onNavigateToSettings: () => void;
    repos: Repository[];
    user: User | null;
}

const RefactorSimulator: React.FC<RefactorSimulatorProps> = ({ onNavigateToSettings, repos, user }) => {
    const { addToast } = useToast();
    const [agentState, setAgentState] = useState<AgentState>('idle');
    const [apiKeyMissing, setApiKeyMissing] = useState(false);
    
    const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>('');
    const [fileTree, setFileTree] = useState<GitHubTreeItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<GitHubTreeItem | null>(null);

    const [originalCode, setOriginalCode] = useState('');
    const [originalFileSha, setOriginalFileSha] = useState('');
    const [refactorResult, setRefactorResult] = useState<RefactorResult | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
    const { theme } = useTheme();

    // Line-based diff calculation
    const lineDiffs = useMemo(() => {
        if (!refactorResult) return [];
        const dmp = new DiffMatchPatch();
        const a = dmp.diff_linesToChars_(originalCode, refactorResult.refactoredCode);
        const diffs = dmp.diff_main(a.chars1, a.chars2, false);
        dmp.diff_charsToLines_(diffs, a.lineArray);
        return diffs;
    }, [originalCode, refactorResult]);
    
    // CodeMirror extensions
    const commonExtensions = useMemo(() => [
        EditorView.lineWrapping,
        EditorView.editable.of(false),
    ], []);
    
    const originalExtensions = useMemo(() => [
        ...commonExtensions,
        getCodeMirrorLanguage(selectedFile ? getLanguageFromFile(selectedFile.path) : ''),
        ...(lineDiffs.length > 0 ? [createLineDiffExtension(lineDiffs, true)] : []),
    ], [commonExtensions, selectedFile, lineDiffs]);

    const refactoredExtensions = useMemo(() => [
        ...commonExtensions,
        getCodeMirrorLanguage(selectedFile ? getLanguageFromFile(selectedFile.path) : ''),
        ...(lineDiffs.length > 0 ? [createLineDiffExtension(lineDiffs, false)] : []),
    ], [commonExtensions, selectedFile, lineDiffs]);


    useEffect(() => {
        setApiKeyMissing(!isApiKeySet());
        if (repos.length > 0 && !selectedRepoFullName) {
            setSelectedRepoFullName(repos[0].full_name);
        }
    }, [repos, selectedRepoFullName]);

    const fetchRepoFiles = useCallback(async (repoFullName: string) => {
        if (!repoFullName) return;
        setAgentState('loading_files');
        setFileTree([]);
        setSelectedFile(null);
        setOriginalCode('');
        setRefactorResult(null);
        try {
            const parsed = parseGitHubUrl(`https://github.com/${repoFullName}`);
            if (!parsed) throw new Error("Invalid repository name.");
            const tree = await getRepoFileTree(parsed.owner, parsed.repo);
            setFileTree(tree);
            setAgentState('idle');
        } catch (error: any) {
            addToast(error.message, 'error');
            setAgentState('idle');
        }
    }, [addToast]);

    useEffect(() => {
        if (user?.github && selectedRepoFullName) {
            fetchRepoFiles(selectedRepoFullName);
        }
    }, [selectedRepoFullName, fetchRepoFiles, user?.github]);

    const handleFileSelect = async (file: GitHubTreeItem) => {
        setAgentState('loading_files');
        setSelectedFile(file);
        setRefactorResult(null);
        try {
            const parsed = parseGitHubUrl(`https://github.com/${selectedRepoFullName}`);
            if (!parsed) throw new Error("Invalid repository name.");
            const content = await getFileContent(parsed.owner, parsed.repo, file.path);
            setOriginalCode(content);
            setOriginalFileSha(file.sha);
            setAgentState('file_selected');
        } catch (error: any) {
            addToast(error.message, 'error');
            setAgentState('idle');
        }
    };

    const handleRefactor = async () => {
        if (!selectedFile || !originalCode) return;
        setAgentState('refactoring');
        try {
            const language = getLanguageFromFile(selectedFile.path);
            const result = await refactorCode(originalCode, language);
            setRefactorResult(result);
            setAgentState('refactor_done');
            addToast('Code refactored successfully!', 'success');
        } catch (error: any) {
            addToast(error.message, 'error');
            setAgentState('file_selected');
        }
    };

    const handleCreatePR = async () => {
        if (!refactorResult || !selectedFile || !selectedRepoFullName) return;
        setAgentState('creating_pr');
        try {
            const parsed = parseGitHubUrl(`https://github.com/${selectedRepoFullName}`);
            if (!parsed) throw new Error("Invalid repository name.");

            const commitMessage = `feat(refactor): Apply Sentinel AI refactor to ${selectedFile.path}`;
            const prTitle = `Sentinel AI Refactor: ${selectedFile.path}`;
            
            const prUrl = await createPullRequestForFix(
                parsed.owner, parsed.repo, selectedFile.path,
                refactorResult.refactoredCode, originalFileSha,
                commitMessage, prTitle
            );
            
            addToast(
                <span>PR created! <a href={prUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">View Pull Request</a></span>,
                'success'
            );
            setRefactorResult(null);
            setAgentState('file_selected');

        } catch (error: any) {
            addToast(error.message, 'error');
            setAgentState('refactor_done');
        }
    };
    
    const PromptMessage: React.FC<{ icon: React.ReactNode, title: string, message: string, buttonLabel?: string, onButtonClick?: () => void }> = ({ icon, title, message, buttonLabel, onButtonClick }) => (
        <div className="h-full w-full flex items-center justify-center p-4 glass-effect rounded-lg">
            <div className="text-center">
                <div className="w-16 h-16 bg-brand-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">{icon}</div>
                <h3 className="text-lg font-bold text-dark-text dark:text-white font-heading">{title}</h3>
                <p className="mt-2 text-medium-dark-text dark:text-medium-text max-w-sm">{message}</p>
                {buttonLabel && onButtonClick && (
                    <button onClick={onButtonClick} className="mt-6 flex items-center justify-center btn-primary mx-auto">
                        <SettingsIcon className="w-5 h-5 mr-2" />
                        {buttonLabel}
                    </button>
                )}
            </div>
        </div>
    );

    const ViewModeToggle = () => (
        <div className="flex items-center space-x-1 bg-light-primary dark:bg-dark-primary p-1 rounded-lg">
            {(['side-by-side', 'original', 'refactored'] as ViewMode[]).map(mode => (
                <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === mode ? 'bg-white dark:bg-dark-secondary text-dark-text dark:text-white' : 'text-medium-dark-text dark:text-medium-text hover:bg-gray-200 dark:hover:bg-white/5'}`}
                >
                    {mode.replace('-', ' ')}
                </button>
            ))}
        </div>
    );

    if (apiKeyMissing) {
        return <PromptMessage icon={<ErrorIcon className="w-8 h-8 text-yellow-500" />} title="Gemini API Key Required" message="Please set your API key in Settings to enable the refactor agent." buttonLabel="Go to Settings" onButtonClick={onNavigateToSettings} />;
    }
    if (!user?.github) {
        return <PromptMessage icon={<GithubIcon className="w-8 h-8 text-medium-dark-text dark:text-medium-text" />} title="GitHub Account Required" message="Please connect your GitHub account in Settings to use the Auto-Refactor Agent." buttonLabel="Go to Settings" onButtonClick={onNavigateToSettings} />;
    }

    return (
        <div className="h-full w-full flex flex-col space-y-4 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-dark-text dark:text-white font-heading">Auto-Refactor Agent</h1>
                    <p className="mt-1 text-medium-dark-text dark:text-medium-text">Select a repository and file to refactor, then create a pull request with one click.</p>
                </div>
                {repos.length > 0 && (
                    <select value={selectedRepoFullName} onChange={e => setSelectedRepoFullName(e.target.value)} className="mt-4 md:mt-0 w-full md:w-72 bg-light-secondary dark:bg-dark-secondary border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm">
                        {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
                    </select>
                )}
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
                <div className="lg:col-span-3 glass-effect rounded-lg p-4 flex flex-col">
                    <h2 className="text-lg font-bold font-heading mb-3 text-dark-text dark:text-white flex-shrink-0">File Explorer</h2>
                    <div className="flex-grow overflow-y-auto border-t border-gray-200 dark:border-white/10 pt-2 -mx-4 px-4">
                        {agentState === 'loading_files' && <div className="flex justify-center pt-8"><SpinnerIcon className="w-6 h-6" /></div>}
                        {agentState !== 'loading_files' && fileTree.length > 0 && (
                            <ul className="space-y-1">
                                {fileTree.map(file => (
                                    <li key={file.path}>
                                        <button onClick={() => handleFileSelect(file)} disabled={['refactoring', 'creating_pr', 'loading_files'].includes(agentState)} className={`w-full flex items-center space-x-2 p-2 rounded-md text-left transition-colors text-sm disabled:opacity-50 ${selectedFile?.path === file.path ? 'bg-brand-purple/20' : 'hover:bg-gray-200 dark:hover:bg-white/5'}`}>
                                            <CodeIcon className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{file.path}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {agentState === 'idle' && fileTree.length === 0 && <p className="text-center text-sm text-medium-dark-text dark:text-medium-text pt-4">No scannable files found.</p>}
                    </div>
                </div>

                <div className="lg:col-span-6 flex flex-col gap-4">
                     <div className="flex-shrink-0 flex flex-wrap gap-2 items-center justify-between">
                        <h2 className="text-lg font-bold font-heading text-dark-text dark:text-white">Code Preview</h2>
                        <div className="flex items-center gap-4">
                             {refactorResult && <ViewModeToggle />}
                              <AnimatePresence mode="wait">
                                {agentState === 'file_selected' && (
                                    <motion.div key="run-button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <button onClick={handleRefactor} className="btn-primary py-2 px-4 flex items-center justify-center">
                                            <BrainCircuitIcon className="w-5 h-5 mr-2" />
                                            <span>Run Refactor</span>
                                        </button>
                                    </motion.div>
                                )}
                                {agentState === 'refactor_done' && (
                                    <motion.div key="pr-button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <button onClick={handleCreatePR} className="btn-primary flex items-center justify-center space-x-2 py-2 px-4">
                                            <GithubIcon className="w-5 h-5" />
                                            <span>Create PR</span>
                                        </button>
                                    </motion.div>
                                )}
                                {(agentState === 'creating_pr' || agentState === 'refactoring') && (
                                    <motion.div key="loading-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <button disabled className="btn-primary py-2 px-4 flex items-center justify-center opacity-70 cursor-not-allowed">
                                            <SpinnerIcon className="w-5 h-5 mr-2" />
                                            <span>{agentState === 'creating_pr' ? 'Creating...' : 'Refactoring...'}</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 relative">
                       <AnimatePresence>
                         {(viewMode === 'side-by-side' || viewMode === 'original') && (
                            <motion.div
                                key="original" layout
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.3, ease: 'easeIn' }}
                                className={viewMode === 'side-by-side' ? 'col-span-1' : 'col-span-1 md:col-span-2'}
                            >
                                <CodeMirror value={originalCode} extensions={originalExtensions} theme={theme === 'dark' ? atomone : 'light'} readOnly={true} />
                            </motion.div>
                         )}
                         {(viewMode === 'side-by-side' || viewMode === 'refactored') && refactorResult && (
                             <motion.div
                                key="refactored" layout
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.3, ease: 'easeIn' }}
                                className={viewMode === 'side-by-side' ? 'col-span-1' : 'col-span-1 md:col-span-2'}
                            >
                                <CodeMirror value={refactorResult.refactoredCode} extensions={refactoredExtensions} theme={theme === 'dark' ? atomone : 'light'} readOnly={true} />
                            </motion.div>
                         )}
                       </AnimatePresence>
                       {(agentState === 'loading_files' || agentState === 'refactoring') && (
                           <div className="absolute inset-0 bg-light-secondary/50 dark:bg-dark-secondary/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                               <SpinnerIcon className="w-8 h-8 text-brand-purple" />
                           </div>
                       )}
                       {!originalCode && agentState !== 'loading_files' && (
                           <div className="absolute inset-0 flex items-center justify-center text-center text-medium-dark-text dark:text-medium-text">
                               <p>Select a file to begin.</p>
                           </div>
                       )}
                    </div>
                </div>

                <div className="lg:col-span-3 glass-effect rounded-lg p-4 flex flex-col">
                    <h2 className="text-lg font-bold font-heading mb-3 text-dark-text dark:text-white flex-shrink-0">Action Panel</h2>

                    <div className="flex-grow overflow-y-auto border-t border-gray-200 dark:border-white/10 pt-3">
                        <AnimatePresence mode="wait">
                            {agentState === 'refactor_done' && refactorResult ? (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-2"
                                >
                                    <h3 className="font-bold text-dark-text dark:text-white">Improvements Made:</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-sm text-medium-dark-text dark:text-medium-text">
                                        {refactorResult.improvements.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center justify-center h-full text-center"
                                >
                                    <p className="text-sm text-medium-dark-text dark:text-medium-text px-4">
                                        {agentState === 'refactoring'
                                            ? 'AI is analyzing and refactoring the code...'
                                            : agentState === 'file_selected'
                                                ? 'The AI will analyze the selected file for potential improvements in security, performance, and readability.'
                                                : 'Select a file from the explorer to begin the refactoring process.'
                                        }
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefactorSimulator;