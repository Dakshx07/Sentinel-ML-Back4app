import React, { useState, useEffect, useCallback } from 'react';
import { Repository, User, DependabotAlert, ScanRecord, DashboardView } from '../types';
import { useToast } from './ToastContext';
import { DatabaseZapIcon, SpinnerIcon, ErrorIcon, SettingsIcon, GithubIcon, AlertTriangleIcon, FileCodeIcon } from './icons';
import { getDependabotAlerts, parseGitHubUrl } from '../services/githubService';
import { getScansForRepo } from '../services/dbService';
import { AnimatePresence, motion } from 'framer-motion';

interface SecurityPulseProps {
    repos: Repository[];
    user: User | null;
    onNavigateToSettings: () => void;
    setActiveView: (view: DashboardView, options?: { repoFullName?: string }) => void;
}

interface FileHeatmapData {
    path: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
}

type ActiveTab = 'dependencies' | 'code';

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center space-x-2 p-3 text-sm font-semibold transition-colors border-b-2 ${active ? 'text-brand-purple border-brand-purple' : 'text-medium-dark-text dark:text-medium-text border-transparent hover:bg-gray-200/50 dark:hover:bg-white/5'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const DependencyScannerContent: React.FC<{ alerts: DependabotAlert[], error: string | null, isLoading: boolean }> = ({ alerts, error, isLoading }) => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-8 h-8" /></div>;
    }
    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                    <ErrorIcon className="w-12 h-12 mx-auto text-orange-500" />
                    <p className="mt-2 font-semibold text-orange-500">{error}</p>
                    <p className="text-sm mt-1 text-medium-dark-text dark:text-medium-text">This can happen if Dependabot is not enabled, or if your PAT is missing the 'security_events' scope.</p>
                </div>
            </div>
        );
    }
    if (alerts.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-center text-medium-dark-text dark:text-medium-text">
                <p>No open dependency vulnerabilities found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-4">
            {alerts.sort((a, b) => {
                const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
                return severityOrder[a.security_advisory.severity] - severityOrder[b.security_advisory.severity];
            }).map(alert => (
                <div key={alert.number} className="bg-light-primary dark:bg-dark-primary p-3 rounded-md border border-gray-200 dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <p className="font-mono text-sm font-semibold text-dark-text dark:text-white">{alert.dependency.package.name}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                            alert.security_advisory.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                            alert.security_advisory.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-yellow-500/20 text-yellow-400'
                        }`}>{alert.security_advisory.severity}</span>
                    </div>
                    <p className="text-xs text-medium-dark-text dark:text-medium-text mt-1">{alert.security_advisory.summary}</p>
                    <a href={alert.html_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-cyan hover:underline mt-2 inline-block">View Details on GitHub</a>
                </div>
            ))}
        </div>
    );
};

const CodeHeatmapContent: React.FC<{ data: FileHeatmapData[], error: string | null, isLoading: boolean, onFileClick: (path: string) => void }> = ({ data, error, isLoading, onFileClick }) => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-8 h-8" /></div>;
    }
    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-center p-4">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-center text-medium-dark-text dark:text-medium-text">
                 <div>
                    <p>No vulnerability data found for this repository.</p>
                    <p className="text-sm mt-1">Run a scan in the GitOps Scanner to populate the heatmap.</p>
                </div>
            </div>
        );
    }

    const getFileBgColor = (file: FileHeatmapData): string => {
        if (file.critical > 0) return 'bg-red-900/50 hover:bg-red-900/70 border-red-500/50';
        if (file.high > 0) return 'bg-orange-900/50 hover:bg-orange-900/70 border-orange-500/50';
        if (file.medium > 0) return 'bg-yellow-900/50 hover:bg-yellow-900/70 border-yellow-500/50';
        if (file.low > 0) return 'bg-blue-900/50 hover:bg-blue-900/70 border-blue-500/50';
        return 'bg-green-900/30 hover:bg-green-900/50 border-green-500/30';
    };

    return (
        <div className="space-y-2 p-4">
            {data.map(file => (
                <button key={file.path} onClick={() => onFileClick(file.path)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${getFileBgColor(file)}`}
                >
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-white font-semibold truncate">{file.path}</span>
                        <div className="flex items-center space-x-3 text-xs flex-shrink-0 ml-4">
                            {file.critical > 0 && <span className="font-bold text-red-400">{file.critical} Crit</span>}
                            {file.high > 0 && <span className="font-semibold text-orange-400">{file.high} High</span>}
                            {file.medium > 0 && <span className="text-yellow-400">{file.medium} Med</span>}
                            {file.low > 0 && <span className="text-blue-400">{file.low} Low</span>}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};

const SecurityPulse: React.FC<SecurityPulseProps> = ({ repos, user, onNavigateToSettings, setActiveView }) => {
    const { addToast } = useToast();
    const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>('');
    const [activeTab, setActiveTab] = useState<ActiveTab>('dependencies');

    // State for Dependency Scanner
    const [isDepLoading, setIsDepLoading] = useState(false);
    const [depAlerts, setDepAlerts] = useState<DependabotAlert[]>([]);
    const [depError, setDepError] = useState<string | null>(null);

    // State for Code Vulnerability Heatmap
    const [isCodeLoading, setIsCodeLoading] = useState(false);
    const [heatmapData, setHeatmapData] = useState<FileHeatmapData[]>([]);
    const [codeError, setCodeError] = useState<string | null>(null);

    useEffect(() => {
        const preselectedRepo = localStorage.getItem('sentinel-selected-repo-pulse');
        if (preselectedRepo && repos.some(r => r.full_name === preselectedRepo)) {
            setSelectedRepoFullName(preselectedRepo);
            localStorage.removeItem('sentinel-selected-repo-pulse');
        } else if (repos.length > 0 && !selectedRepoFullName) {
            setSelectedRepoFullName(repos[0].full_name);
        }
    }, [repos, selectedRepoFullName]);

    const handleDepScan = useCallback(async (repoFullName: string) => {
        if (!repoFullName) return;
        setIsDepLoading(true);
        setDepError(null);
        setDepAlerts([]);

        try {
            const parsed = parseGitHubUrl(`https://github.com/${repoFullName}`);
            if (!parsed) throw new Error("Invalid repository name.");
            const fetchedAlerts = await getDependabotAlerts(parsed.owner, parsed.repo);
            setDepAlerts(fetchedAlerts);
        } catch (e: any) {
            setDepError(e.message);
        } finally {
            setIsDepLoading(false);
        }
    }, []);

    const handleCodeScan = useCallback(async (repoFullName: string) => {
        if (!repoFullName) return;
        setIsCodeLoading(true);
        setCodeError(null);
        setHeatmapData([]);

        try {
            const scans = await getScansForRepo(repoFullName);
            const fileMap = new Map<string, FileHeatmapData>();

            for (const scan of scans) {
                if (!fileMap.has(scan.filePath)) {
                    fileMap.set(scan.filePath, { path: scan.filePath, critical: 0, high: 0, medium: 0, low: 0, total: 0 });
                }
                const fileData = fileMap.get(scan.filePath)!;
                for (const issue of scan.issues) {
                    fileData.total++;
                    if (issue.severity === 'Critical') fileData.critical++;
                    else if (issue.severity === 'High') fileData.high++;
                    else if (issue.severity === 'Medium') fileData.medium++;
                    else if (issue.severity === 'Low') fileData.low++;
                }
            }
            const sortedData = Array.from(fileMap.values()).sort((a, b) => {
                 if (b.critical !== a.critical) return b.critical - a.critical;
                 if (b.high !== a.high) return b.high - a.high;
                 return b.total - a.total;
            });
            setHeatmapData(sortedData);
        } catch (e: any) {
            setCodeError("Failed to load scan history from the database.");
        } finally {
            setIsCodeLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedRepoFullName) {
            if (activeTab === 'dependencies') {
                handleDepScan(selectedRepoFullName);
            } else {
                handleCodeScan(selectedRepoFullName);
            }
        }
    }, [selectedRepoFullName, activeTab, handleDepScan, handleCodeScan]);
    
    const handleFileClick = (filePath: string) => {
        const repoUrl = `https://github.com/${selectedRepoFullName}`;
        localStorage.setItem('sentinel-gitops-preload', JSON.stringify({ repoUrl, filePath }));
        setActiveView('gitops');
    };

    if (!user?.github) {
        return (
            <div className="h-full w-full flex items-center justify-center p-4">
                <div className="text-center glass-effect p-12 rounded-lg">
                    <GithubIcon className="w-16 h-16 mx-auto text-gray-400" />
                    <h2 className="text-2xl font-bold text-dark-text dark:text-white font-heading mt-4">Connect to GitHub</h2>
                    <p className="mt-2 max-w-sm text-medium-dark-text dark:text-medium-text">
                       Please connect your GitHub account in settings to use the Security Pulse.
                    </p>
                    <button onClick={onNavigateToSettings} className="mt-6 btn-primary">
                        Go to Settings
                    </button>
                </div>
            </div>
        );
    }
    
    if (repos.length === 0) {
        return (
             <div className="h-full w-full flex items-center justify-center p-4">
                 <div className="text-center glass-effect p-12 rounded-lg">
                    <h2 className="text-2xl font-bold text-dark-text dark:text-white font-heading">No Repositories Added</h2>
                    <p className="mt-2 max-w-sm text-medium-dark-text dark:text-medium-text">
                        Add a repository on the Repositories page to view its Security Pulse.
                    </p>
                    <button onClick={() => setActiveView('repositories')} className="mt-6 btn-primary">
                        Add Repository
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col space-y-4 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-3">
                    <DatabaseZapIcon className="w-8 h-8 text-brand-purple" />
                    <div>
                        <h1 className="text-3xl font-bold text-dark-text dark:text-white font-heading">Security Pulse</h1>
                        <p className="mt-1 text-medium-dark-text dark:text-medium-text">A unified view of your repository's security health.</p>
                    </div>
                </div>
                <select value={selectedRepoFullName} onChange={e => setSelectedRepoFullName(e.target.value)} className="mt-4 md:mt-0 w-full md:w-72 bg-light-secondary dark:bg-dark-secondary border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm">
                    {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
                </select>
            </div>
            
             <div className="flex-grow glass-effect rounded-lg flex flex-col overflow-hidden">
                <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-white/10">
                    <TabButton active={activeTab === 'dependencies'} onClick={() => setActiveTab('dependencies')} icon={<AlertTriangleIcon className="w-5 h-5"/>} label="Dependency Vulnerabilities" />
                    <TabButton active={activeTab === 'code'} onClick={() => setActiveTab('code')} icon={<FileCodeIcon className="w-5 h-5"/>} label="Code Vulnerabilities" />
                </div>
                <div className="flex-grow overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {activeTab === 'dependencies' ? (
                                <DependencyScannerContent alerts={depAlerts} error={depError} isLoading={isDepLoading} />
                            ) : (
                                <CodeHeatmapContent data={heatmapData} error={codeError} isLoading={isCodeLoading} onFileClick={handleFileClick} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
             </div>
        </div>
    );
};

export default SecurityPulse;