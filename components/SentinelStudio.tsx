import React, { useState, useEffect, useCallback, useRef } from 'react';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import { AnalysisIssue, CodeFile, InputMode, SampleRepo } from '../types';
import { SQL_INJECTION_EXAMPLE } from '../constants';
import { analyzeCode, isApiKeySet } from '../services/geminiService';
import { useToast } from './ToastContext';
import { addScan } from '../services/dbService';

interface SentinelStudioProps {
  onNavigateToSettings: () => void;
}

const getLanguageFromName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const map: { [key: string]: string } = {
    'py': 'python', 'ts': 'typescript', 'tsx': 'typescript',
    'js': 'javascript', 'jsx': 'javascript', 'tf': 'hcl',
    'hcl': 'hcl', 'json': 'json', 'html': 'xml', 'css': 'css',
  };
  return map[extension || ''] || 'plaintext';
};

const SentinelStudio: React.FC<SentinelStudioProps> = ({ onNavigateToSettings }) => {
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.SampleRepo);
  const [selectedRepo, setSelectedRepo] = useState<SampleRepo | null>(SQL_INJECTION_EXAMPLE);
  const [activeFile, setActiveFile] = useState<CodeFile | null>(SQL_INJECTION_EXAMPLE.files[0]);
  const [snippet, setSnippet] = useState<string>('');
  const [issues, setIssues] = useState<AnalysisIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<AnalysisIssue | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fixDiff, setFixDiff] = useState<string | null>(null);
  const { addToast } = useToast();
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // FEAT: Add state and ref for auto-analysis feature.
  const debounceTimeoutRef = useRef<number | null>(null);
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);

  const runAnalysis = useCallback(async (codeToAnalyze: string, language: string, repoName: string, filePath: string) => {
    if (!isApiKeySet()) {
      setApiKeyMissing(true);
      setIsLoading(false);
      setIssues([]);
      return;
    }
    setApiKeyMissing(false);

    if (!codeToAnalyze) {
      setIssues([]);
      setIsLoading(false);
      return;
    };

    setIsLoading(true);
    setIssues([]);
    setSelectedIssue(null);
    setFixDiff(null);

    try {
      const results = await analyzeCode(codeToAnalyze, language);

      const codeLines = codeToAnalyze.split('\n').length;
      const validatedResults = results.map(issue => {
        if (issue.line > codeLines || issue.line <= 0) {
          console.warn(`AI returned an invalid line number (${issue.line}) for a file with ${codeLines} lines. Adjusting.`);
          return { ...issue, line: -1, description: `[Warning: Invalid Line Number Reported by AI] ${issue.description}` };
        }
        return issue;
      });

      setIssues(validatedResults);

      // FEAT: Log scan to IndexedDB
      await addScan({
        repoFullName: repoName,
        filePath: filePath,
        timestamp: Date.now(),
        issues: validatedResults,
        status: 'open',
        source: 'studio'
      });


      if (validatedResults.length > 0) {
        const validIssues = validatedResults.filter(r => r.line !== -1);
        const sortedResults = [...(validIssues.length > 0 ? validIssues : validatedResults)].sort((a, b) =>
          ['Critical', 'High', 'Medium', 'Low'].indexOf(a.severity) -
          ['Critical', 'High', 'Medium', 'Low'].indexOf(b.severity)
        );
        setSelectedIssue(sortedResults[0]);
      }
    } catch (e: any) {
      addToast(e.message || 'An unknown error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const handleApplyFix = useCallback(async (issueToFix: AnalysisIssue) => {
    const codeProvider = activeFile || (snippet ? { content: snippet, language: 'plaintext' } : null);
    if (!codeProvider) return;

    const originalCodeLines = codeProvider.content.split('\n');
    const lineIndex = issueToFix.line - 1;

    if (lineIndex < 0 || lineIndex >= originalCodeLines.length) {
      addToast("Error: Could not apply fix due to an invalid line number.");
      console.error("Invalid line number for fix:", issueToFix.line);
      return;
    }

    const fixLines = issueToFix.suggestedFix.trim().split('\n');
    originalCodeLines.splice(lineIndex, 1, ...fixLines);
    const newContent = originalCodeLines.join('\n');

    if (activeFile) {
      setActiveFile({ ...activeFile, content: newContent });
    } else if (snippet) {
      setSnippet(newContent);
    }

    addToast('Fix applied. Re-analyzing code...');
    setSelectedIssue(null);
    setFixDiff(null);

    await runAnalysis(newContent, codeProvider.language, selectedRepo?.name || 'Snippet', activeFile?.name || 'snippet.txt');
  }, [activeFile, snippet, runAnalysis, addToast, selectedRepo, setSelectedRepo]);

  useEffect(() => {
    if (inputMode === InputMode.SampleRepo && activeFile?.content) {
      runAnalysis(activeFile.content, activeFile.language, selectedRepo?.name || 'Sample', activeFile.name);
    }
  }, [activeFile, inputMode, runAnalysis, selectedRepo]);

  // FEAT: This effect implements the "file watcher" by debouncing analysis on snippet changes.
  useEffect(() => {
    if (inputMode !== InputMode.Snippet) {
      setIsAutoAnalyzing(false);
      return;
    }

    if (!snippet.trim()) {
      setIssues([]);
      setSelectedIssue(null);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      setIsAutoAnalyzing(false);
      return;
    }

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    setIsAutoAnalyzing(true);

    debounceTimeoutRef.current = window.setTimeout(() => {
      setIsAutoAnalyzing(false);
      const lang = activeFile?.language || getLanguageFromName(activeFile?.name || 'snippet.txt');
      const fileName = activeFile?.name || 'snippet.txt';
      runAnalysis(snippet, lang, 'Snippet', fileName);
    }, 1200);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [snippet, inputMode, activeFile, runAnalysis]);


  useEffect(() => {
    const keyIsSet = isApiKeySet();
    setApiKeyMissing(!keyIsSet);
    if (keyIsSet) {
      if (inputMode === InputMode.SampleRepo && activeFile) {
        runAnalysis(activeFile.content, activeFile.language, selectedRepo?.name || 'Sample', activeFile.name);
      }
    } else {
      setIssues([]);
      setSelectedIssue(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = ({ name, content }: { name: string, content: string }) => {
    setInputMode(InputMode.Snippet);
    setSnippet(content);
    setSelectedRepo(null);
    setActiveFile({ name, content, language: getLanguageFromName(name) });
    setIssues([]);
    setSelectedIssue(null);
    setFixDiff(null);
    addToast(`Loaded ${name}. Auto-analyzing...`, 'info');
  };

  useEffect(() => {
    if (selectedIssue) {
      const codeProvider = activeFile || (snippet ? { content: snippet } : null);
      if (!codeProvider) return;

      if (selectedIssue.line === -1) {
        setFixDiff(null); return;
      }
      const originalCodeLines = codeProvider.content.split('\n');
      const lineIndex = selectedIssue.line - 1;

      if (lineIndex < 0 || lineIndex >= originalCodeLines.length) {
        console.error(`Invalid line number from analysis: ${selectedIssue.line}`);
        setFixDiff(null); return;
      }
      const oldLine = originalCodeLines[lineIndex];
      const newLines = selectedIssue.suggestedFix.trim().split('\n');
      const diffText = `-${oldLine.trim()}\n` + newLines.map(l => `+${l}`).join('\n');
      setFixDiff(diffText);
    } else {
      setFixDiff(null);
    }
  }, [selectedIssue, activeFile, snippet]);

  return (
    <div className="h-full w-full bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-2xl animate-fade-in-up">
      <div className="lg:col-span-3 h-full overflow-hidden">
        <LeftPanel
          inputMode={inputMode} setInputMode={setInputMode} selectedRepo={selectedRepo}
          setSelectedRepo={setSelectedRepo} activeFile={activeFile} setActiveFile={setActiveFile}
          snippet={snippet} setSnippet={setSnippet}
          isLoading={isLoading && inputMode === InputMode.Snippet}
          onFileChange={handleFileChange}
          isAutoAnalyzing={isAutoAnalyzing}
        />
      </div>
      <div className="lg:col-span-5 h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-white/5">
        <CenterPanel
          activeFile={activeFile || (snippet ? { name: 'Snippet', language: 'plaintext', content: snippet } : null)}
          issues={issues} selectedIssue={selectedIssue} fixDiff={fixDiff}
          isLoading={isLoading}
        />
      </div>
      <div className="lg:col-span-4 h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-white/5">
        <RightPanel
          issues={issues} isLoading={isLoading} selectedIssue={selectedIssue}
          setSelectedIssue={setSelectedIssue} onApplyFix={handleApplyFix}
          isApiKeyMissing={apiKeyMissing} onNavigateToSettings={onNavigateToSettings}
          appliedIssue={null}
          onCommitFix={() => { }}
          onRevertFix={() => { }}
          isCommitting={false}
        />
      </div>
    </div>
  );
};

export default SentinelStudio;