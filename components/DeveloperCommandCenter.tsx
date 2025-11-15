import React, { useState, useEffect } from 'react';
import { User, Repository, DashboardView } from '../types';
import { getDashboardData } from '../services/reviewService';
import type { IVulnerability, IActivityLog } from '../services/reviewService';
import { useToast } from './ToastContext';
import { RepoIcon, ShieldIcon, TrendingUpIcon, HistoryIcon, CheckCircleIcon, CpuChipIcon } from './icons';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';

interface DeveloperCommandCenterProps {
    user: User | null;
    repos: Repository[];
    setActiveView: (view: DashboardView, options?: { repoFullName?: string }) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-effect p-5 rounded-lg flex items-center space-x-4 border border-gray-200 dark:border-white/10"
    >
        <div className="p-3 bg-brand-purple/10 rounded-lg text-brand-purple">
            {icon}
        </div>
        <div>
            <p className="text-sm text-medium-dark-text dark:text-medium-text">{title}</p>
            <p className="text-2xl font-bold text-dark-text dark:text-white">{value}</p>
        </div>
    </motion.div>
);

const TrendChart: React.FC<{ data: any }> = ({ data }) => {
    const { theme } = useTheme();
    const [Chart, setChart] = useState<any>(() => (window as any).ReactApexChart);

    useEffect(() => {
        if (Chart) return;

        const intervalId = setInterval(() => {
            if ((window as any).ReactApexChart) {
                setChart(() => (window as any).ReactApexChart);
                clearInterval(intervalId);
            }
        }, 100);

        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
        }, 5000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [Chart]);

    if (!Chart) {
        return (
            <div className="flex items-center justify-center h-[250px]">
                <p className="text-medium-dark-text dark:text-medium-text">Chart library not loaded.</p>
            </div>
        );
    }

    const options = {
        chart: {
            type: 'area',
            height: 250,
            toolbar: { show: false },
            zoom: { enabled: false },
            foreColor: theme === 'dark' ? '#A4A4C8' : '#4B5563',
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3, colors: ['#9F54FF'] },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.2,
                stops: [0, 90, 100],
                colorStops: [
                    { offset: 0, color: '#9F54FF', opacity: 0.5 },
                    { offset: 100, color: '#9F54FF', opacity: 0.0 }
                ]
            }
        },
        xaxis: {
            categories: data.categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            tooltip: { enabled: false },
        },
        yaxis: {
            labels: {
                formatter: (val: number) => val.toFixed(0),
            },
        },
        grid: {
            show: true,
            borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            strokeDashArray: 4,
        },
        tooltip: {
            theme: theme,
        }
    };

    return React.createElement(Chart, {
        options: options,
        series: data.series,
        type: "area",
        height: 250,
        width: "100%"
    });
};


const DeveloperCommandCenter: React.FC<DeveloperCommandCenterProps> = ({ user, repos, setActiveView }) => {
    const [stats, setStats] = useState<{
        totalRepos: number;
        autoReviewCount: number;
        criticalCount: number;
        highPriorityVulnerabilities: IVulnerability[];
        recentActivity: IActivityLog[];
        trendData: { categories: string[]; series: { name: string; data: number[] }[] };
    } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        try {
            const data = getDashboardData(repos);
            setStats(data);
        } catch (e: any) {
            addToast("Failed to load dashboard data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [repos, addToast]);

    const getActivityIcon = (type: IActivityLog['type']) => {
        switch(type) {
            case 'NEW_VULNERABILITY': return <ShieldIcon severity="Critical" className="w-5 h-5 text-red-500" />;
            case 'AUTOREVIEW_ENABLED': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'SCAN_COMPLETED': return <CpuChipIcon className="w-5 h-5 text-blue-500" />;
            default: return <HistoryIcon className="w-5 h-5" />;
        }
    };

    if (isLoading || !stats) {
        return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    return (
        <div className="h-full w-full space-y-6 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-dark-text dark:text-white font-heading">Developer Command Center</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Repositories" value={stats.totalRepos} icon={<RepoIcon className="w-6 h-6" />} />
                <StatCard title="Auto-Reviews Enabled" value={stats.autoReviewCount} icon={<CheckCircleIcon className="w-6 h-6" />} />
                <StatCard title="Critical Vulnerabilities" value={stats.criticalCount} icon={<ShieldIcon severity="Critical" className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-2 glass-effect p-6 rounded-lg border border-gray-200 dark:border-white/10"
                >
                    <h2 className="text-lg font-bold text-dark-text dark:text-white font-heading mb-4 flex items-center">
                        <ShieldIcon className="w-5 h-5 mr-2 text-brand-purple" />
                        High-Priority Vulnerabilities
                    </h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {stats.highPriorityVulnerabilities.length > 0 ? stats.highPriorityVulnerabilities.map(vuln => (
                            <div key={vuln.id} className="bg-light-primary dark:bg-dark-primary p-3 rounded-md flex items-center justify-between">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <ShieldIcon severity={vuln.severity} className="w-6 h-6 flex-shrink-0" />
                                    <div className="overflow-hidden">
                                        <p className="font-semibold text-dark-text dark:text-white truncate">{vuln.title}</p>
                                        <p className="text-xs text-medium-dark-text dark:text-medium-text truncate">{vuln.repoName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const repo = repos.find(r => r.id === vuln.repoId);
                                        if (repo) {
                                            localStorage.setItem('sentinel-gitops-preload', JSON.stringify({ 
                                                repoUrl: `https://github.com/${repo.full_name}`,
                                                filePath: vuln.filePath,
                                            }));
                                            setActiveView('gitops');
                                        } else {
                                            addToast("Could not find repository details.", "error");
                                        }
                                    }}
                                    className="text-xs font-semibold text-brand-cyan hover:underline flex-shrink-0 ml-2"
                                >
                                    Investigate
                                </button>
                            </div>
                        )) : (
                            <p className="text-center py-8 text-medium-dark-text dark:text-medium-text">No high-priority vulnerabilities found. Great job!</p>
                        )}
                    </div>
                </motion.div>

                <div className="space-y-6">
                     <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="glass-effect p-6 rounded-lg border border-gray-200 dark:border-white/10"
                    >
                        <h2 className="text-lg font-bold text-dark-text dark:text-white font-heading mb-4 flex items-center">
                            <TrendingUpIcon className="w-5 h-5 mr-2 text-brand-purple" />
                            Vulnerability Trend
                        </h2>
                        <TrendChart data={stats.trendData} />
                    </motion.div>
                </div>
            </div>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="glass-effect p-6 rounded-lg border border-gray-200 dark:border-white/10"
            >
                <h2 className="text-lg font-bold text-dark-text dark:text-white font-heading mb-4 flex items-center">
                    <HistoryIcon className="w-5 h-5 mr-2 text-brand-purple" />
                    Recent Activity
                </h2>
                <ul className="space-y-3">
                    {stats.recentActivity.length > 0 ? stats.recentActivity.map(log => (
                        <li key={log.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-3">
                                {getActivityIcon(log.type)}
                                <p className="text-medium-dark-text dark:text-medium-text">{log.text}</p>
                            </div>
                            <span className="text-xs text-medium-dark-text dark:text-medium-text">{log.time}</span>
                        </li>
                    )) : (
                         <p className="text-center py-4 text-medium-dark-text dark:text-medium-text">No recent activity.</p>
                    )}
                </ul>
            </motion.div>

        </div>
    );
};

export default DeveloperCommandCenter;