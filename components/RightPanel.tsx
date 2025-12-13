import React from 'react';
import { AnalysisIssue } from '../types';
import { ShieldIcon, ErrorIcon, SettingsIcon, ChevronDownIcon } from './icons';
import AnalysisLoader from './AnalysisLoader';

interface RightPanelProps {
  issues: AnalysisIssue[];
  isLoading: boolean;
  selectedIssue: AnalysisIssue | null;
  setSelectedIssue: (issue: AnalysisIssue | null) => void;
  onApplyFix: (issue: AnalysisIssue) => void;
  isApiKeyMissing?: boolean;
  onNavigateToSettings?: () => void;
  appliedIssue: AnalysisIssue | null;
  onCommitFix: () => void;
  onRevertFix: () => void;
  isCommitting: boolean;
  progressText?: string;
}

const SeverityBadge: React.FC<{ severity: string; count: number }> = ({ severity, count }) => {
  const colorClasses: { [key: string]: string } = {
    Critical: 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
    High: 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
    Low: 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
  };
  return (
    <div className={`flex items-center space-x-2 px-3 py-1 border rounded-full text-xs font-medium backdrop-blur-sm ${colorClasses[severity]}`}>
      <span className="uppercase tracking-wider">{severity}</span>
      <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
    </div>
  );
};

const IssueCard: React.FC<{
  issue: AnalysisIssue;
  isSelected: boolean;
  onSelect: () => void;
  onApplyFix: () => void;
  isFixApplied: boolean;
  onCommitFix: () => void;
  onRevertFix: () => void;
  isCommitting: boolean;
  hasActiveFix: boolean;
}> = ({ issue, isSelected, onSelect, onApplyFix, isFixApplied, onCommitFix, onRevertFix, isCommitting, hasActiveFix }) => {
  const isInvalidLine = issue.line === -1;
  return (
    <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isSelected ? 'bg-white/5 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/10'}`}>
      <button onClick={onSelect} className="w-full p-4 text-left">
        <div className="flex items-start space-x-3">
          <ShieldIcon severity={issue.severity} className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-grow min-w-0">
            <p className="font-bold text-white text-sm truncate font-heading">{issue.title}</p>
            <div className="text-xs text-gray-500 mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1">
              {issue.filePath && (
                <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded truncate inline-block max-w-full border border-white/5" title={issue.filePath}>
                  {issue.filePath}
                </span>
              )}
              <span className="flex-shrink-0 whitespace-nowrap font-mono">
                {isInvalidLine ? (
                  <span className="text-yellow-400 font-semibold">Invalid Line</span>
                ) : (
                  `Line ${issue.line}`
                )} &bull; {issue.severity}
              </span>
            </div>
          </div>
          <ChevronDownIcon className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-300 ${isSelected ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isSelected && (
        <div className="px-4 pb-4 border-t border-white/5 space-y-3 text-sm text-gray-400 animate-fade-in bg-black/20">
          <div className="pt-3">
            <p><span className="font-bold text-gray-300 text-xs uppercase tracking-wider">Description</span><br />{issue.description}</p>
          </div>
          <div>
            <p><span className="font-bold text-gray-300 text-xs uppercase tracking-wider">Impact</span><br />{issue.impact}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {isFixApplied ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onCommitFix(); }}
                  className="bg-green-500 text-black font-bold text-xs py-2 px-4 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  disabled={isCommitting}
                >
                  {isCommitting ? 'Creating PR...' : 'Push Fix & Create PR'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onRevertFix(); }}
                  className="bg-white/10 text-white font-semibold text-xs py-2 px-4 rounded-lg transition-colors hover:bg-white/20 disabled:opacity-50"
                  disabled={isCommitting}
                >
                  Revert
                </button>
              </>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onApplyFix(); }}
                className="bg-blue-600 text-white font-bold text-xs py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center"
                disabled={isInvalidLine || hasActiveFix}
                title={hasActiveFix ? "Another fix is active. Please commit or revert it first." : ""}
              >
                Preview & Apply Fix
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const RightPanel: React.FC<RightPanelProps> = ({ issues, isLoading, selectedIssue, setSelectedIssue, onApplyFix, isApiKeyMissing, onNavigateToSettings, appliedIssue, onCommitFix, onRevertFix, isCommitting, progressText }) => {
  const severities = ['Critical', 'High', 'Medium', 'Low'];
  const issueCounts = severities.reduce((acc, severity) => {
    acc[severity] = issues.filter(i => i.severity === severity).length;
    return acc;
  }, {} as { [key: string]: number });

  const renderContent = () => {
    if (isApiKeyMissing) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <ErrorIcon className="w-12 h-12 text-yellow-500 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-white font-heading">Gemini API Key Required</h3>
          <p className="mt-2 text-gray-400 max-w-sm text-sm">
            Please set your API key in the AI Agent Settings to enable code analysis.
          </p>
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="mt-6 flex items-center justify-center px-6 py-2.5 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform text-sm"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Go to Settings
            </button>
          )}
        </div>
      );
    }

    if (isLoading) {
      return <AnalysisLoader progressText={progressText} steps={[
        'Parsing file structure...',
        'Building syntax tree...',
        'Analyzing data flows...',
        'Checking for vulnerabilities...',
        'Compiling security report...'
      ]} />;
    }

    if (issues.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <ShieldIcon className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-medium">No issues found. Clean code!</p>
        </div>
      );
    }

    return (
      <>
        <div className="p-4 border-b border-white/5 bg-black/20">
          <h3 className="text-sm font-bold text-white font-heading mb-3 uppercase tracking-wider">Security Report</h3>
          <div className="flex flex-wrap gap-2">
            {severities.map(s => issueCounts[s] > 0 && <SeverityBadge key={s} severity={s} count={issueCounts[s]} />)}
          </div>
        </div>
        <div className="flex-grow p-4 space-y-3 overflow-y-auto custom-scrollbar">
          {issues.sort((a, b) => severities.indexOf(a.severity) - severities.indexOf(b.severity)).map((issue, index) => {
            const issueId = `${issue.filePath}-${issue.line}-${issue.title}`;
            const appliedIssueId = appliedIssue ? `${appliedIssue.filePath}-${appliedIssue.line}-${appliedIssue.title}` : null;
            return (
              <IssueCard
                key={`${issue.line}-${index}-${issue.title}`}
                issue={issue}
                isSelected={selectedIssue === issue}
                onSelect={() => setSelectedIssue(selectedIssue === issue ? null : issue)}
                onApplyFix={() => onApplyFix(issue)}
                isFixApplied={!!appliedIssue && appliedIssueId === issueId}
                onCommitFix={onCommitFix}
                onRevertFix={onRevertFix}
                isCommitting={isCommitting}
                hasActiveFix={!!appliedIssue}
              />
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="bg-transparent flex flex-col h-full">
      {renderContent()}
    </div>
  );
};

export default RightPanel;