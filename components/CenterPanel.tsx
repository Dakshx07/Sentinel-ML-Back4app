import React, { useMemo } from 'react';
import { AnalysisIssue, CodeFile } from '../types';
import { SpinnerIcon } from './icons';

// Declare hljs for TypeScript since it's loaded from a script tag
declare global {
  interface Window {
    hljs: any;
  }
}

interface CenterPanelProps {
  activeFile: CodeFile | null;
  issues: AnalysisIssue[];
  selectedIssue: AnalysisIssue | null;
  fixDiff: string | null;
  isLoading?: boolean;
}


const getCommentPrefix = (language: string): string => {
  const lang = language.toLowerCase();
  if (['python', 'ruby', 'shell', 'hcl', 'terraform'].includes(lang)) {
    return '#';
  }
  return '//';
};


const DiffViewer: React.FC<{ diff: string; language: string; issue: AnalysisIssue; }> = ({ diff, language, issue }) => {
  const commentPrefix = getCommentPrefix(language);

  const escapeHtml = (unsafe: string) =>
    unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  const diffBlock = useMemo(() => {
    const commentLines = [
      `${commentPrefix} AI Analysis: ${issue.title}`,
      `${commentPrefix} Severity: ${issue.severity}`,
      `${commentPrefix} Impact: ${issue.impact}`,
      `${commentPrefix} --- Suggested Change ---`
    ];

    const allLines = [...commentLines, ...diff.split('\n')];

    return allLines.map((line, index) => {
      const isComment = index < commentLines.length;

      if (isComment) {
        const highlightedComment = (typeof window.hljs !== 'undefined' && line.trim())
          ? window.hljs.highlight(line, { language, ignoreIllegals: true }).value
          : escapeHtml(line);

        return (
          <div key={index} className="flex">
            <span className="w-8 pl-4 text-center select-none flex-shrink-0"> </span>
            <span className="flex-1 text-gray-400 italic" dangerouslySetInnerHTML={{ __html: highlightedComment }} />
          </div>
        );
      }

      const prefix = line.charAt(0);
      if (prefix !== '+' && prefix !== '-') {
        return null; // Skip non-diff lines
      }
      const content = line.substring(1);
      const lineClass = prefix === '+' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300 line-through opacity-70';

      const highlightedContent = (typeof window.hljs !== 'undefined' && content.trim())
        ? window.hljs.highlight(content, { language, ignoreIllegals: true }).value
        : escapeHtml(content);

      return (
        <div key={index} className={`flex ${lineClass}`}>
          <span className="w-8 pl-4 text-center select-none opacity-70 flex-shrink-0">{prefix}</span>
          <span className="flex-1" dangerouslySetInnerHTML={{ __html: highlightedContent || ' ' }} />
        </div>
      );
    }).filter(Boolean); // Filter out nulls
  }, [diff, language, issue, commentPrefix]);

  return (
    <pre className="text-sm font-mono whitespace-pre-wrap break-words p-4">
      <code>
        {diffBlock}
      </code>
    </pre>
  );
};


const CenterPanel: React.FC<CenterPanelProps> = ({ activeFile, issues, selectedIssue, fixDiff, isLoading }) => {

  const getLineClassName = (lineNumber: number): string => {
    const issueOnLine = issues.find(i => i.line === lineNumber);
    const baseClass = 'px-4 hover:bg-white/5 transition-colors';
    if (selectedIssue?.line === lineNumber) {
      return `${baseClass} bg-purple-500/20 border-l-2 border-purple-500`;
    }
    if (issueOnLine) {
      const severityClasses: { [key: string]: string } = {
        Critical: 'bg-red-500/20 border-l-2 border-red-500',
        High: 'bg-orange-500/20 border-l-2 border-orange-500',
        Medium: 'bg-yellow-500/20 border-l-2 border-yellow-500',
        Low: 'bg-blue-500/20 border-l-2 border-blue-500',
      };
      return `${baseClass} ${severityClasses[issueOnLine.severity]}`;
    }
    return baseClass;
  };

  const renderCode = () => {
    if (!activeFile) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="w-16 h-16 border-2 border-white/10 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <p className="text-sm">Select a file to begin analysis</p>
        </div>
      );
    }

    const isValidFix = selectedIssue?.suggestedFix && selectedIssue.suggestedFix.trim().length > 0;

    if (fixDiff && selectedIssue && isValidFix) {
      return <DiffViewer diff={fixDiff} language={activeFile.language} issue={selectedIssue} />;
    }

    const highlightedCodeHTML = useMemo(() => {
      if (!activeFile || typeof window.hljs === 'undefined') return activeFile.content;
      try {
        return window.hljs.highlight(activeFile.content, { language: activeFile.language, ignoreIllegals: true }).value;
      } catch (e) {
        console.error("Highlight.js error:", e);
        return activeFile.content; // Fallback to plain text on error
      }
    }, [activeFile]);

    const codeLines = highlightedCodeHTML.split('\n');
    return (
      <pre className="text-sm font-mono whitespace-pre-wrap break-words py-4">
        <code>
          {codeLines.map((line, index) => (
            <div key={index} className={`flex ${getLineClassName(index + 1)}`}>
              <span className="w-12 text-right pr-4 text-gray-600 select-none font-mono text-xs pt-0.5">{index + 1}</span>
              <span className="flex-1 text-gray-300" dangerouslySetInnerHTML={{ __html: line || ' ' }} />
            </div>
          ))}
        </code>
      </pre>
    );
  }

  return (
    <div className="bg-transparent text-white flex flex-col h-full relative">
      <div className="px-4 py-3 border-b border-white/5 text-xs font-mono text-gray-400 flex items-center justify-between bg-black/20">
        <span>{activeFile?.name || 'No file selected'}</span>
        {activeFile && <span className="text-[10px] uppercase tracking-wider opacity-50">{activeFile.language}</span>}
      </div>
      <div className="flex-grow relative min-h-0 bg-[#0d1117]/50">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          {renderCode()}
        </div>
      </div>
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <SpinnerIcon className="w-10 h-10 text-blue-500 mx-auto animate-spin" />
            <p className="mt-3 font-bold text-white tracking-wide">ANALYZING CODE STRUCTURE</p>
            <p className="text-xs text-gray-500 mt-1">Detecting vulnerabilities...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CenterPanel;