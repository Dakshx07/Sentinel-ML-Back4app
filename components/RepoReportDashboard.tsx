import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Repository, User } from '../types';
import { useToast } from './ToastContext';
import { DocumentTextIcon, SpinnerIcon, ErrorIcon, SettingsIcon, GithubIcon } from './icons';
import { getRepoCommits, getRepoContributors, getRepoLanguages, parseGitHubUrl } from '../services/githubService';
import { generateRepoReport, isApiKeySet } from '../services/geminiService';
import AnalysisLoader from './AnalysisLoader';

declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
    }
}

interface RepoReportDashboardProps {
    repos: Repository[];
    user: User | null;
    onNavigateToSettings: () => void;
}

const RepoReportDashboard: React.FC<RepoReportDashboardProps> = ({ repos, user, onNavigateToSettings }) => {
    const { addToast } = useToast();
    const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const apiKeyMissing = !isApiKeySet();
    const reportContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (repos.length > 0 && !selectedRepoFullName) {
            setSelectedRepoFullName(repos[0].full_name);
        }
    }, [repos, selectedRepoFullName]);

    const handleGenerateReport = useCallback(async () => {
        if (!selectedRepoFullName) {
            addToast('Please select a repository.', 'warning');
            return;
        }

        setIsLoading(true);
        setReport('');
        setError(null);

        try {
            const repo = repos.find(r => r.full_name === selectedRepoFullName);
            if (!repo) throw new Error('Selected repository not found.');

            const parsed = parseGitHubUrl(`https://github.com/${repo.full_name}`);
            if (!parsed) throw new Error('Could not parse repository name.');
            
            const [commits, contributors, languages] = await Promise.all([
                getRepoCommits(parsed.owner, parsed.repo, 10),
                getRepoContributors(parsed.owner, parsed.repo),
                getRepoLanguages(parsed.owner, parsed.repo),
            ]);
            
            const aiReport = await generateRepoReport(repo, commits, contributors, languages);
            setReport(aiReport);
            addToast('Report generated successfully!', 'success');

        } catch (e: any) {
            const errorMessage = e.message || 'Failed to generate report.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedRepoFullName, repos, addToast]);
    
    const handleExportPdf = async () => {
        if (!window.jspdf || !window.html2canvas) {
            addToast('PDF generation library is still loading. Please try again in a moment.', 'info');
            return;
        }
        
        const reportElement = reportContentRef.current;
        if (!reportElement || !report) {
            addToast('No report content to export.', 'warning');
            return;
        }
        
        addToast('Generating PDF...', 'info');
        
        try {
            const { jsPDF } = window.jspdf;
            const canvas = await window.html2canvas(reportElement, {
                backgroundColor: document.documentElement.classList.contains('dark') ? '#10102A' : '#FFFFFF',
                scale: 2,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            
            pdf.save(`${selectedRepoFullName.replace('/', '_')}_report.pdf`);
            addToast('PDF exported successfully!', 'success');
        } catch (e) {
            console.error("PDF Export Error:", e);
            addToast('Failed to generate PDF.', 'error');
        }
    };

    if (apiKeyMissing || !user?.github) {
        return (
            <div className="h-full w-full flex items-center justify-center p-4 glass-effect rounded-lg">
                <div className="text-center">
                     <ErrorIcon className="w-12 h-12 text-yellow-500 mb-4 mx-auto" />
                     <h3 className="text-lg font-bold text-dark-text dark:text-white font-heading">Setup Required</h3>
                     <p className="mt-2 text-medium-dark-text dark:text-medium-text max-w-sm">Please ensure your Gemini API Key and GitHub PAT are set in Settings to use this feature.</p>
                     <button onClick={onNavigateToSettings} className="mt-6 flex items-center justify-center btn-primary mx-auto">
                        <SettingsIcon className="w-5 h-5 mr-2" />
                        Go to Settings
                    </button>
                </div>
            </div>
        );
    }
    
     if (repos.length === 0) {
        return (
             <div className="h-full w-full flex items-center justify-center p-4 glass-effect rounded-lg">
                <div className="text-center">
                     <GithubIcon className="w-12 h-12 text-medium-dark-text dark:text-medium-text mb-4 mx-auto" />
                     <h3 className="text-lg font-bold text-dark-text dark:text-white font-heading">No Repositories Found</h3>
                     <p className="mt-2 text-medium-dark-text dark:text-medium-text max-w-sm">Please add a repository on the Repositories page to generate a report.</p>
                </div>
            </div>
        )
    }

    const renderMarkdown = (text: string) => {
        return text
            .replace(/^### (.*$)/gim, '<h3 class="font-bold text-xl mb-3 mt-6 text-brand-cyan">$1</h3>')
            .replace(/\*\*(.*)\*\*/g, '<strong class="text-dark-text dark:text-white">$1</strong>')
            .replace(/^- (.*$)/gim, '<li class="ml-5 mb-1">$1</li>')
            .replace(/(\n)/gm, '<br />')
            .replace(/(<br \/><br \/>)/g, '<br />')
            .replace(/<br \/>(<h3)/g, '$1')
            .replace(/(<\/li><br \/>)/g, '</li>');
    };

    return (
        <div className="h-full w-full flex flex-col space-y-4 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-8 h-8 text-brand-purple" />
                    <div>
                        <h1 className="text-3xl font-bold text-dark-text dark:text-white font-heading">AI Repo Report</h1>
                        <p className="mt-1 text-medium-dark-text dark:text-medium-text">Generate a comprehensive, developer-focused summary of a repository.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                    <select
                        value={selectedRepoFullName}
                        onChange={e => setSelectedRepoFullName(e.target.value)}
                        className="w-full md:w-60 bg-light-secondary dark:bg-dark-secondary border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm"
                    >
                        {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
                    </select>
                    <button onClick={handleGenerateReport} disabled={isLoading} className="btn-primary py-2 px-4 w-40 text-center disabled:opacity-50">
                        {isLoading ? <SpinnerIcon className="w-5 h-5 mx-auto" /> : 'Generate Report'}
                    </button>
                    <button onClick={handleExportPdf} disabled={!report || isLoading} className="btn-secondary py-2 px-4 disabled:opacity-50">
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="flex-grow glass-effect rounded-lg p-6 overflow-y-auto">
                {isLoading && (
                     <div className="flex items-center justify-center h-full">
                        <AnalysisLoader steps={['Fetching repository data...', 'Analyzing commits & contributors...', 'Generating AI summary...']} />
                    </div>
                )}
                {!isLoading && error && (
                    <div className="flex items-center justify-center h-full text-center text-red-500">
                        <p>{error}</p>
                    </div>
                )}
                {!isLoading && !error && report && (
                    <div ref={reportContentRef} className="prose prose-sm md:prose-base dark:prose-invert max-w-none leading-relaxed p-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }} />
                )}
                {!isLoading && !error && !report && (
                    <div className="flex items-center justify-center h-full text-center text-medium-dark-text dark:text-medium-text">
                        <div>
                            <DocumentTextIcon className="w-16 h-16 mx-auto opacity-10" />
                            <p className="mt-4">Your generated report will appear here.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepoReportDashboard;