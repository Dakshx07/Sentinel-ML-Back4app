import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from './ToastContext';
import { BrainCircuitIcon, ErrorIcon, SettingsIcon, SpinnerIcon, GithubIcon, CodeIcon, DoubleArrowRightIcon, DoubleArrowLeftIcon, CheckIcon, DocumentTextIcon } from './icons';
import { isApiKeySet, refactorCode } from '../services/geminiService';
import { createPullRequestForFix, getRepoFileTree, getFileContent, parseGitHubUrl } from '../services/githubService';
import { RefactorResult, Repository, User, GitHubTreeItem } from '../types';
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

        update(update: ViewUpdate) { }

        buildDecorations(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>();
            let lineNumber = 1;
            for (const [op, text] of lineDiffs) {
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

                if (op !== (isOriginal ? 1 : -1)) {
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
    const [isFilePanelCollapsed, setIsFilePanelCollapsed] = useState(false);

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
        EditorView.theme({
            "&": { backgroundColor: "transparent !important" },
            ".cm-gutters": { backgroundColor: "transparent !important", borderRight: "1px solid rgba(255,255,255,0.1)" },
            ".cm-line-delete": { backgroundColor: "rgba(239, 68, 68, 0.15) !important" },
            ".cm-line-insert": { backgroundColor: "rgba(16, 185, 129, 0.15) !important" },
        })
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
        <div className="h-full w-full flex items-center justify-center p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
            <div className="text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-white font-heading mb-2">{title}</h3>
                <p className="text-gray-400 max-w-sm text-sm leading-relaxed mb-8">{message}</p>
                {buttonLabel && onButtonClick && (
                    <motion.button
                        onClick={onButtonClick}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-white text-black font-bold text-sm rounded-full flex items-center space-x-2 mx-auto hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
                    >
                        <SettingsIcon className="w-4 h-4" />
                        <span>{buttonLabel}</span>
                    </motion.button>
                )}
            </div>
        </div>
    );

    const ViewModeToggle = () => (
        <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-lg border border-white/10">
            {(['side-by-side', 'original', 'refactored'] as ViewMode[]).map(mode => (
                <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === mode
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    {mode.replace('-', ' ')}
                </button>
            ))}
        </div>
    );

    if (apiKeyMissing) {
        return <PromptMessage icon={<ErrorIcon className="w-10 h-10 text-red-500" />} title="Gemini API Key Required" message="Please set your API key in Settings to enable the refactor agent." buttonLabel="Go to Settings" onButtonClick={onNavigateToSettings} />;
    }
    if (!user?.github) {
        return <PromptMessage icon={<GithubIcon className="w-10 h-10 text-gray-400" />} title="GitHub Account Required" message="Please connect your GitHub account in Settings to use the Auto-Refactor Agent." buttonLabel="Go to Settings" onButtonClick={onNavigateToSettings} />;
    }

    return (
        <div className="h-full w-full flex flex-col space-y-4 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div>
                    <h1 className="text-2xl font-bold text-white font-heading tracking-tight flex items-center space-x-3">
                        <BrainCircuitIcon className="w-6 h-6 text-purple-400" />
                        <span>Auto-Refactor Agent</span>
                    </h1>
                    <p className="mt-2 text-sm text-gray-400 max-w-xl">Select a repository and file to refactor, then create a pull request with one click.</p>
                </div>
                {repos.length > 0 && (
                    <div className="mt-4 md:mt-0 relative">
                        <select
                            value={selectedRepoFullName}
                            onChange={e => setSelectedRepoFullName(e.target.value)}
                            className="w-full md:w-72 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all appearance-none cursor-pointer font-mono"
                        >
                            {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <DoubleArrowRightIcon className="w-3 h-3 text-gray-500 rotate-90" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
                {/* File Explorer */}
                <motion.div
                    initial={false}
                    animate={{ width: isFilePanelCollapsed ? 'auto' : '100%' }}
                    className={`lg:col-span-3 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${isFilePanelCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'}`}
                >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        {!isFilePanelCollapsed && <h2 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wider">File Explorer</h2>}
                        <button onClick={() => setIsFilePanelCollapsed(!isFilePanelCollapsed)} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors ml-auto">
                            {isFilePanelCollapsed ? <DoubleArrowRightIcon className="w-4 h-4" /> : <DoubleArrowLeftIcon className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                        {agentState === 'loading_files' && <div className="flex justify-center pt-8"><SpinnerIcon className="w-6 h-6 text-purple-400 animate-spin" /></div>}
                        {agentState !== 'loading_files' && fileTree.length > 0 && (
                            <ul className="space-y-1">
                                {fileTree.map(file => (
                                    <li key={file.path}>
                                        <motion.button
                                            onClick={() => handleFileSelect(file)}
                                            disabled={['refactoring', 'creating_pr', 'loading_files'].includes(agentState)}
                                            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                            className={`w-full flex items-center space-x-3 p-2.5 rounded-lg text-left transition-all text-xs disabled:opacity-50 group ${selectedFile?.path === file.path
                                                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                                : 'text-gray-400 border border-transparent'
                                                }`}
                                        >
                                            <CodeIcon className={`w-4 h-4 flex-shrink-0 ${selectedFile?.path === file.path ? 'text-purple-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                                            {!isFilePanelCollapsed && <span className="truncate font-mono">{file.path}</span>}
                                        </motion.button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {agentState === 'idle' && fileTree.length === 0 && <p className="text-center text-xs text-gray-500 pt-8">No scannable files found.</p>}
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className={`${isFilePanelCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'} flex flex-col gap-4`}>
                    {/* Toolbar */}
                    <div className="flex-shrink-0 flex flex-wrap gap-4 items-center justify-between bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-lg">
                        <div className="flex items-center space-x-3">
                            <h2 className="text-sm font-bold font-heading text-white uppercase tracking-wider">Code Preview</h2>
                            {selectedFile && <span className="text-xs text-gray-500 font-mono px-2 py-1 bg-white/5 rounded-md">{selectedFile.path}</span>}
                        </div>

                        <div className="flex items-center gap-4">
                            {refactorResult && <ViewModeToggle />}
                            <AnimatePresence mode="wait">
                                {agentState === 'file_selected' && (
                                    <motion.div key="run-button" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                        <button onClick={handleRefactor} className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center space-x-2">
                                            <BrainCircuitIcon className="w-4 h-4" />
                                            <span>Run Refactor</span>
                                        </button>
                                    </motion.div>
                                )}
                                {agentState === 'refactor_done' && (
                                    <motion.div key="pr-button" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                        <button onClick={handleCreatePR} className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center space-x-2">
                                            <GithubIcon className="w-4 h-4" />
                                            <span>Create PR</span>
                                        </button>
                                    </motion.div>
                                )}
                                {(agentState === 'creating_pr' || agentState === 'refactoring') && (
                                    <motion.div key="loading-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                        <button disabled className="px-5 py-2 bg-white/10 text-white text-xs font-bold rounded-xl cursor-not-allowed flex items-center space-x-2">
                                            <SpinnerIcon className="w-4 h-4 animate-spin" />
                                            <span>{agentState === 'creating_pr' ? 'Creating...' : 'Refactoring...'}</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
                        {/* Editor Area */}
                        <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative flex flex-col">
                            <div className="flex-grow overflow-hidden relative custom-scrollbar">
                                <AnimatePresence>
                                    {(viewMode === 'side-by-side' || viewMode === 'original') && (
                                        <motion.div
                                            key="original" layout
                                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                            transition={{ duration: 0.3, ease: 'easeIn' }}
                                            className={`h-full overflow-auto ${viewMode === 'side-by-side' ? 'w-1/2 float-left border-r border-white/5' : 'w-full'}`}
                                        >
                                            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/5 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Original</div>
                                            <CodeMirror value={originalCode} extensions={originalExtensions} theme={atomone} readOnly={true} className="text-xs" height="100%" />
                                        </motion.div>
                                    )}
                                    {(viewMode === 'side-by-side' || viewMode === 'refactored') && refactorResult && (
                                        <motion.div
                                            key="refactored" layout
                                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                                            transition={{ duration: 0.3, ease: 'easeIn' }}
                                            className={`h-full overflow-auto ${viewMode === 'side-by-side' ? 'w-1/2 float-left' : 'w-full'}`}
                                        >
                                            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/5 px-4 py-2 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Refactored</div>
                                            <CodeMirror value={refactorResult.refactoredCode} extensions={refactoredExtensions} theme={atomone} readOnly={true} className="text-xs" height="100%" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {(agentState === 'loading_files' || agentState === 'refactoring') && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                                        <div className="flex flex-col items-center space-y-4">
                                            <SpinnerIcon className="w-10 h-10 text-purple-500 animate-spin" />
                                            <p className="text-sm font-bold text-white tracking-wider animate-pulse">{agentState === 'loading_files' ? 'LOADING FILE...' : 'AI REFACTORING...'}</p>
                                        </div>
                                    </div>
                                )}

                                {!originalCode && agentState !== 'loading_files' && (
                                    <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                                        <div className="max-w-xs">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <DocumentTextIcon className="w-8 h-8 text-gray-600" />
                                            </div>
                                            <p className="text-gray-500 text-sm">Select a file from the explorer to begin.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Panel / Results */}
                        <div className="lg:col-span-1 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
                            <div className="p-4 border-b border-white/5">
                                <h2 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wider">Analysis Results</h2>
                            </div>

                            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {agentState === 'refactor_done' && refactorResult ? (
                                        <motion.div
                                            key="results"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                                                <CheckIcon className="w-4 h-4" />
                                                <span className="text-sm font-bold">Refactor Complete</span>
                                            </div>

                                            <div className="space-y-3">
                                                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Improvements</h3>
                                                <ul className="space-y-2">
                                                    {refactorResult.improvements.map((item, i) => (
                                                        <li key={i} className="flex items-start space-x-2 text-xs text-gray-300 bg-white/5 p-2 rounded-lg border border-white/5">
                                                            <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                                            <span className="leading-relaxed">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="placeholder"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center h-full text-center p-4"
                                        >
                                            {agentState === 'refactoring' ? (
                                                <>
                                                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 animate-pulse">
                                                        <BrainCircuitIcon className="w-6 h-6 text-purple-500" />
                                                    </div>
                                                    <p className="text-xs text-gray-400">AI is analyzing and refactoring the code...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-xs text-gray-500 leading-relaxed">
                                                        {agentState === 'file_selected'
                                                            ? 'Ready to analyze. Click "Run Refactor" to let the AI improve security, performance, and readability.'
                                                            : 'Select a file to see AI-powered refactoring suggestions here.'
                                                        }
                                                    </p>
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefactorSimulator;