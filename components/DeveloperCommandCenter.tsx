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

// Vibrant Stat Card with glow effects
const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'red' | 'violet' | 'amber';
    delay?: number;
}> = ({ title, value, icon, color, delay = 0 }) => {
    const colorStyles = {
        blue: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            iconBg: 'bg-blue-500/20',
            iconText: 'text-blue-400',
            glow: 'hover:shadow-blue-500/10',
            valueText: 'text-blue-400',
        },
        green: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            iconBg: 'bg-emerald-500/20',
            iconText: 'text-emerald-400',
            glow: 'hover:shadow-emerald-500/10',
            valueText: 'text-emerald-400',
        },
        red: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            iconBg: 'bg-red-500/20',
            iconText: 'text-red-400',
            glow: 'hover:shadow-red-500/10',
            valueText: 'text-red-400',
        },
        violet: {
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20',
            iconBg: 'bg-violet-500/20',
            iconText: 'text-violet-400',
            glow: 'hover:shadow-violet-500/10',
            valueText: 'text-violet-400',
        },
        amber: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            iconBg: 'bg-amber-500/20',
            iconText: 'text-amber-400',
            glow: 'hover:shadow-amber-500/10',
            valueText: 'text-amber-400',
        },
    };

    const styles = colorStyles[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`${styles.bg} p-5 rounded-2xl flex items-center space-x-4 border ${styles.border} backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${styles.glow} cursor-default`}
        >
            <div className={`p-3 ${styles.iconBg} rounded-xl ${styles.iconText}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                <p className={`text-3xl font-bold ${styles.valueText}`}>{value}</p>
            </div>
        </motion.div>
    );
};

// Premium Chart Component
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
        const timeoutId = setTimeout(() => clearInterval(intervalId), 5000);
        return () => { clearInterval(intervalId); clearTimeout(timeoutId); };
    }, [Chart]);

    if (!Chart) {
        return (
            <div className="flex items-center justify-center h-[200px]">
                <div className="animate-pulse text-gray-500">Loading chart...</div>
            </div>
        );
    }

    const options = {
        chart: {
            type: 'area',
            height: 200,
            toolbar: { show: false },
            zoom: { enabled: false },
            foreColor: '#6B7280',
            background: 'transparent',
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3, colors: ['#3B82F6'] },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.0,
                stops: [0, 100],
                colorStops: [
                    { offset: 0, color: '#3B82F6', opacity: 0.4 },
                    { offset: 100, color: '#3B82F6', opacity: 0.0 }
                ]
            }
        },
        xaxis: {
            categories: data.categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#6B7280', fontSize: '10px' } },
        },
        yaxis: {
            labels: {
                formatter: (val: number) => val.toFixed(0),
                style: { colors: '#6B7280', fontSize: '10px' }
            },
        },
        grid: {
            show: true,
            borderColor: 'rgba(255, 255, 255, 0.05)',
            strokeDashArray: 4,
            padding: { left: 10, right: 10 }
        },
        tooltip: { theme: 'dark' }
    };

    return React.createElement(Chart, { options, series: data.series, type: "area", height: 200, width: "100%" });
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
        switch (type) {
            case 'NEW_VULNERABILITY': return <ShieldIcon severity="Critical" className="w-4 h-4 text-red-400" />;
            case 'AUTOREVIEW_ENABLED': return <CheckCircleIcon className="w-4 h-4 text-emerald-400" />;
            case 'SCAN_COMPLETED': return <CpuChipIcon className="w-4 h-4 text-blue-400" />;
            default: return <HistoryIcon className="w-4 h-4 text-gray-400" />;
        }
    };

    if (isLoading || !stats) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-2xl font-bold text-white">Command Center</h1>
                <p className="text-gray-500 text-sm mt-1">Security overview and insights</p>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Repositories"
                    value={stats.totalRepos}
                    icon={<RepoIcon className="w-6 h-6" />}
                    color="blue"
                    delay={0.1}
                />
                <StatCard
                    title="Auto-Reviews"
                    value={stats.autoReviewCount}
                    icon={<CheckCircleIcon className="w-6 h-6" />}
                    color="green"
                    delay={0.2}
                />
                <StatCard
                    title="Critical Issues"
                    value={stats.criticalCount}
                    icon={<ShieldIcon severity="Critical" className="w-6 h-6" />}
                    color={stats.criticalCount > 0 ? "red" : "green"}
                    delay={0.3}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Vulnerabilities Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="lg:col-span-2 bg-[#0A0A0A] p-6 rounded-2xl border border-white/5"
                >
                    <h2 className="text-base font-semibold text-white mb-4 flex items-center">
                        <div className="p-1.5 bg-red-500/20 rounded-lg mr-2">
                            <ShieldIcon severity="High" className="w-4 h-4 text-red-400" />
                        </div>
                        High-Priority Vulnerabilities
                    </h2>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {stats.highPriorityVulnerabilities.length > 0 ? stats.highPriorityVulnerabilities.map((vuln, i) => (
                            <motion.div
                                key={vuln.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                                className="bg-white/[0.02] hover:bg-white/[0.05] p-3 rounded-xl flex items-center justify-between transition-colors group border border-white/5"
                            >
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <ShieldIcon severity={vuln.severity} className="w-5 h-5 flex-shrink-0" />
                                    <div className="overflow-hidden">
                                        <p className="font-medium text-white text-sm truncate">{vuln.title}</p>
                                        <p className="text-xs text-gray-500 truncate">{vuln.repoName}</p>
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
                                    className="text-xs font-medium text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors flex-shrink-0 ml-2"
                                >
                                    Investigate
                                </button>
                            </motion.div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                                    <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
                                </div>
                                <p className="text-gray-400 text-sm">No high-priority vulnerabilities</p>
                                <p className="text-gray-600 text-xs mt-1">Your codebase is secure</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5"
                >
                    <h2 className="text-base font-semibold text-white mb-4 flex items-center">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg mr-2">
                            <TrendingUpIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        Vulnerability Trend
                    </h2>
                    <TrendChart data={stats.trendData} />
                </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="bg-[#0A0A0A] p-6 rounded-2xl border border-white/5"
            >
                <h2 className="text-base font-semibold text-white mb-4 flex items-center">
                    <div className="p-1.5 bg-violet-500/20 rounded-lg mr-2">
                        <HistoryIcon className="w-4 h-4 text-violet-400" />
                    </div>
                    Recent Activity
                </h2>
                <div className="space-y-2">
                    {stats.recentActivity.length > 0 ? stats.recentActivity.map((log, i) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + i * 0.05 }}
                            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="p-1.5 bg-white/5 rounded-lg">
                                    {getActivityIcon(log.type)}
                                </div>
                                <p className="text-sm text-gray-400">{log.text}</p>
                            </div>
                            <span className="text-xs text-gray-600">{log.time}</span>
                        </motion.div>
                    )) : (
                        <p className="text-center py-6 text-gray-500 text-sm">No recent activity</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default DeveloperCommandCenter;