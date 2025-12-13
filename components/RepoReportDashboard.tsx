import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Repository, User } from '../types';
import { useToast } from './ToastContext';
import { DocumentTextIcon, SpinnerIcon, ErrorIcon, SettingsIcon, GithubIcon, DownloadIcon, SparklesIcon } from './icons';
import { getRepoCommits, getRepoContributors, getRepoLanguages, parseGitHubUrl } from '../services/githubService';
import { generateRepoReport, isApiKeySet } from '../services/geminiService';
import AnalysisLoader from './AnalysisLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

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
                backgroundColor: '#050505',
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
            <div className="h-full w-full flex items-center justify-center p-4">
                <div className="text-center bg-[#050505]/80 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl max-w-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 blur-[50px] rounded-full pointer-events-none" />
                    <ErrorIcon className="w-16 h-16 text-red-500 mb-6 mx-auto animate-pulse relative z-10" />
                    <h3 className="text-2xl font-bold text-white mb-2 font-heading relative z-10">Access Denied</h3>
                    <p className="mt-2 text-gray-400 relative z-10">Security protocols require API configuration and GitHub authentication.</p>
                    <button onClick={onNavigateToSettings} className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center mx-auto relative z-10">
                        <SettingsIcon className="w-5 h-5 mr-2" /> Configure System
                    </button>
                </div>
            </div>
        );
    }

    if (repos.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center p-4">
                <div className="text-center bg-[#050505]/80 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none" />
                    <GithubIcon className="w-16 h-16 text-gray-600 mb-6 mx-auto relative z-10" />
                    <h3 className="text-2xl font-bold text-white font-heading relative z-10">No Repositories Found</h3>
                    <p className="mt-2 text-gray-400 relative z-10">Please add a repository on the Repositories page to generate a report.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full w-full flex flex-col space-y-6 animate-fade-in-up p-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white font-heading tracking-tighter">INTELLIGENCE REPORT</h1>
                    <p className="text-gray-400 text-sm mt-2 font-mono flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
                        AI-POWERED REPOSITORY ANALYSIS
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group flex-grow md:flex-grow-0">
                        <select
                            value={selectedRepoFullName}
                            onChange={e => setSelectedRepoFullName(e.target.value)}
                            className="appearance-none w-full md:w-64 bg-[#050505] border border-white/10 text-white pl-4 pr-10 py-3 rounded-xl focus:outline-none focus:border-purple-500/50 transition-colors font-mono text-sm"
                        >
                            {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateReport}
                        disabled={isLoading}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center space-x-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                        <span className="hidden sm:inline">{isLoading ? 'ANALYZING...' : 'GENERATE'}</span>
                    </button>
                    <button
                        onClick={handleExportPdf}
                        disabled={!report || isLoading}
                        className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl flex items-center space-x-2 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export PDF"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-y-auto custom-scrollbar shadow-2xl relative min-h-[500px]">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#050505]/90 backdrop-blur-sm z-20 rounded-3xl">
                        <AnalysisLoader steps={['ESTABLISHING SECURE CONNECTION...', 'SCANNING REPOSITORY STRUCTURE...', 'ANALYZING COMMIT HISTORY...', 'SYNTHESIZING INTELLIGENCE REPORT...']} />
                    </div>
                )}

                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <ErrorIcon className="w-16 h-16 text-red-500 mb-4" />
                        <p className="text-red-400 font-mono">{error}</p>
                    </div>
                )}

                {!isLoading && !error && report && (
                    <div ref={reportContentRef} className="prose prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-300 prose-a:text-purple-400 prose-strong:text-white prose-code:text-purple-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {report}
                        </ReactMarkdown>
                    </div>
                )}

                {!isLoading && !error && !report && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-50">
                        <DocumentTextIcon className="w-24 h-24 mb-6" />
                        <p className="font-heading text-xl tracking-widest">AWAITING ANALYSIS TARGET</p>
                        <p className="font-mono text-sm mt-2">Select a repository and initiate generation sequence.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepoReportDashboard;