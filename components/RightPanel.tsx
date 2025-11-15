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
    Critical: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/50',
    High: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/50',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-400/20 dark:text-yellow-300 dark:border-yellow-400/50',
    Low: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-400/20 dark:text-blue-300 dark:border-blue-400/50',
  };
  return (
    <div className={`flex items-center space-x-2 px-3 py-1 border rounded-full text-sm ${colorClasses[severity]}`}>
      <span className="font-semibold">{severity}</span>
      <span className="font-mono text-xs bg-black/10 dark:bg-black/20 px-1.5 py-0.5 rounded-full">{count}</span>
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
    <div className={`border rounded-lg transition-all duration-300 ${isSelected ? 'bg-brand-purple/10 border-brand-purple' : 'bg-light-secondary dark:bg-dark-primary border-gray-200 dark:border-white/10'}`}>
      <button onClick={onSelect} className="w-full p-3 text-left">
        <div className="flex items-start space-x-3">
          <ShieldIcon severity={issue.severity} className="w-6 h-6 flex-shrink-0 mt-1" />
          <div className="flex-grow min-w-0">
            <p className="font-semibold text-dark-text dark:text-white truncate">{issue.title}</p>
            <div className="text-xs text-medium-dark-text dark:text-medium-text mt-1 flex items-center flex-wrap gap-x-2 gap-y-1">
                {issue.filePath && (
                    <span className="font-mono bg-gray-200 dark:bg-black/20 px-1.5 py-0.5 rounded truncate inline-block max-w-full" title={issue.filePath}>
                        {issue.filePath}
                    </span>
                )}
                <span className="flex-shrink-0 whitespace-nowrap">
                    {isInvalidLine ? (
                        <span className="text-yellow-500 dark:text-yellow-400 font-semibold">Invalid Line</span> 
                    ) : (
                        `Line ${issue.line}`
                    )} &bull; {issue.severity}
                </span>
            </div>
          </div>
          <ChevronDownIcon className={`w-5 h-5 text-medium-dark-text dark:text-medium-text flex-shrink-0 transition-transform duration-300 ${isSelected ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isSelected && (
        <div className="mt-2 px-4 pb-4 border-t border-gray-200 dark:border-white/10 space-y-3 text-sm text-medium-dark-text dark:text-medium-text animate-fade-in">
          <div className="pt-3">
            <p><span className="font-semibold text-dark-text dark:text-white">Description:</span> {issue.description}</p>
          </div>
          <div>
            <p><span className="font-semibold text-dark-text dark:text-white">Impact:</span> {issue.impact}</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {isFixApplied ? (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); onCommitFix(); }}
                        className="btn-primary text-xs py-1 px-3 disabled:opacity-50"
                        disabled={isCommitting}
                    >
                        {isCommitting ? 'Creating PR...' : 'Push Fix & Create PR'}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRevertFix(); }}
                        className="bg-gray-200 dark:bg-white/10 text-dark-text dark:text-white font-semibold text-xs py-1 px-3 rounded-md transition-colors hover:bg-gray-300 dark:hover:bg-white/20 disabled:opacity-50"
                        disabled={isCommitting}
                    >
                        Revert
                    </button>
                </>
            ) : (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onApplyFix(); }}
                    className="btn-primary text-xs py-1 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <ErrorIcon className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-bold text-dark-text dark:text-white font-heading">Gemini API Key Required</h3>
            <p className="mt-2 text-medium-dark-text dark:text-medium-text max-w-sm">
                Please set your API key in the AI Agent Settings to enable code analysis.
            </p>
            {onNavigateToSettings && (
                <button
                    onClick={onNavigateToSettings}
                    className="mt-6 flex items-center justify-center btn-primary"
                >
                    <SettingsIcon className="w-5 h-5 mr-2" />
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
      return <div className="flex items-center justify-center h-full text-medium-dark-text dark:text-medium-text"><p>No issues found. Clean code!</p></div>;
    }
    
    return (
        <>
            <div className="p-4 border-b border-gray-200 dark:border-white/10">
                <h3 className="text-lg font-bold text-dark-text dark:text-light-text font-heading mb-3">Sentinel Review</h3>
                <div className="flex flex-wrap gap-2">
                    {severities.map(s => issueCounts[s] > 0 && <SeverityBadge key={s} severity={s} count={issueCounts[s]} />)}
                </div>
            </div>
            <div className="flex-grow p-4 space-y-3 overflow-y-auto">
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
    <div className="bg-light-secondary dark:bg-dark-secondary border-l border-gray-200 dark:border-white/10 flex flex-col h-full">
      {renderContent()}
    </div>
  );
};

export default RightPanel;