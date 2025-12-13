import React, { useState, useEffect } from 'react';
import { User, Repository, DashboardView } from '../types';
import { getDashboardData } from '../services/reviewService';
import type { IVulnerability, IActivityLog } from '../services/reviewService';
import { useToast } from './ToastContext';
import { RepoIcon, ShieldIcon, TrendingUpIcon, HistoryIcon, CheckCircleIcon, CpuChipIcon, SparklesIcon, AlertTriangleIcon, BoltIcon } from './icons';
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
            bg: 'bg-blue-500/5',
            border: 'border-blue-500/20',
            iconBg: 'bg-blue-500/20',
            iconText: 'text-blue-400',
            glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
            valueText: 'text-white',
        },
        green: {
            bg: 'bg-emerald-500/5',
            border: 'border-emerald-500/20',
            iconBg: 'bg-emerald-500/20',
            iconText: 'text-emerald-400',
            glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
            valueText: 'text-white',
        },
        red: {
            bg: 'bg-red-500/5',
            border: 'border-red-500/20',
            iconBg: 'bg-red-500/20',
            iconText: 'text-red-400',
            glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
            valueText: 'text-white',
        },
        violet: {
            bg: 'bg-violet-500/5',
            border: 'border-violet-500/20',
            iconBg: 'bg-violet-500/20',
            iconText: 'text-violet-400',
            glow: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]',
            valueText: 'text-white',
        },
        amber: {
            bg: 'bg-amber-500/5',
            border: 'border-amber-500/20',
            iconBg: 'bg-amber-500/20',
            iconText: 'text-amber-400',
            glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
            valueText: 'text-white',
        },
    };

    const styles = colorStyles[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ scale: 1.02, y: -5 }}
            className={`${styles.bg} p-6 rounded-3xl flex items-center space-x-5 border ${styles.border} backdrop-blur-xl transition-all duration-300 hover:shadow-2xl ${styles.glow} group`}
        >
            <div className={`p-4 ${styles.iconBg} rounded-2xl ${styles.iconText} group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                <p className={`text-4xl font-black ${styles.valueText} font-heading tracking-tight`}>{value}</p>
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
            <div className="flex items-center justify-center h-[250px] bg-white/5 rounded-2xl border border-white/5">
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-500 text-xs font-mono">INITIALIZING VISUALIZATION...</span>
                </div>
            </div>
        );
    }

    const options = {
        chart: {
            type: 'area',
            height: 250,
            toolbar: { show: false },
            zoom: { enabled: false },
            foreColor: '#6B7280',
            background: 'transparent',
            fontFamily: 'Space Grotesk, sans-serif',
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3, colors: ['#3B82F6'] },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.5,
                opacityTo: 0.0,
                stops: [0, 100],
                colorStops: [
                    { offset: 0, color: '#3B82F6', opacity: 0.5 },
                    { offset: 100, color: '#3B82F6', opacity: 0.0 }
                ]
            }
        },
        xaxis: {
            categories: data.categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#9CA3AF', fontSize: '11px', fontFamily: 'Space Grotesk' } },
            tooltip: { enabled: false }
        },
        yaxis: {
            labels: {
                formatter: (val: number) => val.toFixed(0),
                style: { colors: '#9CA3AF', fontSize: '11px', fontFamily: 'Space Grotesk' }
            },
        },
        grid: {
            show: true,
            borderColor: 'rgba(255, 255, 255, 0.03)',
            strokeDashArray: 4,
            padding: { left: 10, right: 10, top: 0, bottom: 0 }
        },
        tooltip: {
            theme: 'dark',
            style: { fontFamily: 'Space Grotesk' },
            x: { show: false },
            marker: { show: false },
        },
        markers: { size: 0, hover: { size: 5, colors: ['#3B82F6'], strokeColors: '#fff', strokeWidth: 2 } }
    };

    return React.createElement(Chart, { options, series: data.series, type: "area", height: 250, width: "100%" });
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
    const [mlApiStatus, setMlApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
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

    // Check ML API Status
    useEffect(() => {
        const checkMlApi = async () => {
            try {
                const API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                // Just a simple ping or check if we can reach it. 
                // Since there might not be a GET / endpoint, we'll try a dummy POST or just assume offline if fetch fails immediately.
                // Actually, let's just try to fetch root. If it 404s but connects, it's online.
                try {
                    await fetch(API_URL, { method: 'GET', signal: controller.signal });
                    setMlApiStatus('online');
                } catch (e: any) {
                    // If it's a network error, it's offline. If it's a 404/405, it's online but endpoint missing.
                    if (e.name === 'AbortError' || e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
                        setMlApiStatus('offline');
                    } else {
                        setMlApiStatus('online'); // Connected but got error response (which means server is up)
                    }
                }
                clearTimeout(timeoutId);
            } catch (e) {
                setMlApiStatus('offline');
            }
        };
        checkMlApi();
    }, []);

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
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <SparklesIcon className="w-6 h-6 text-blue-400 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-mono tracking-widest uppercase">Initializing Command Center...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full space-y-8 p-2">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-black text-white font-heading tracking-tighter">COMMAND CENTER</h1>
                    <p className="text-gray-400 text-sm mt-2 font-mono flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${mlApiStatus === 'online' ? 'bg-emerald-500' : mlApiStatus === 'offline' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                        SYSTEM ONLINE • ML CORE: <span className={mlApiStatus === 'online' ? 'text-emerald-400' : mlApiStatus === 'offline' ? 'text-red-400' : 'text-amber-400'}>{mlApiStatus.toUpperCase()}</span>
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setActiveView('repoReport')}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 flex items-center space-x-2"
                    >
                        <BoltIcon className="w-4 h-4" />
                        <span>GENERATE REPORT</span>
                    </button>
                    <button
                        onClick={() => setActiveView('repositories')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-105 flex items-center space-x-2"
                    >
                        <RepoIcon className="w-4 h-4" />
                        <span>MANAGE REPOS</span>
                    </button>
                </div>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Repositories"
                    value={stats.totalRepos}
                    icon={<RepoIcon className="w-8 h-8" />}
                    color="blue"
                    delay={0.1}
                />
                <StatCard
                    title="Active Monitors"
                    value={stats.autoReviewCount}
                    icon={<CheckCircleIcon className="w-8 h-8" />}
                    color="green"
                    delay={0.2}
                />
                <StatCard
                    title="Critical Threats"
                    value={stats.criticalCount}
                    icon={<AlertTriangleIcon className="w-8 h-8" />}
                    color={stats.criticalCount > 0 ? "red" : "green"}
                    delay={0.3}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Vulnerabilities Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="lg:col-span-2 bg-[#050505]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-red-500/10 transition-colors duration-500" />

                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <h2 className="text-lg font-bold text-white flex items-center font-heading tracking-tight">
                            <div className="p-2 bg-red-500/10 rounded-lg mr-3 border border-red-500/20">
                                <ShieldIcon severity="High" className="w-5 h-5 text-red-400" />
                            </div>
                            THREAT DETECTION
                        </h2>
                        <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                            {stats.highPriorityVulnerabilities.length} DETECTED
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                        {stats.highPriorityVulnerabilities.length > 0 ? stats.highPriorityVulnerabilities.map((vuln, i) => (
                            <motion.div
                                key={vuln.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                                className="bg-white/[0.02] hover:bg-white/[0.05] p-4 rounded-2xl flex items-center justify-between transition-all duration-300 group/item border border-white/5 hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                            >
                                <div className="flex items-center space-x-4 overflow-hidden">
                                    <div className="p-2 bg-red-500/10 rounded-xl flex-shrink-0">
                                        <ShieldIcon severity={vuln.severity} className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-white text-sm truncate group-hover/item:text-red-400 transition-colors">{vuln.title}</p>
                                        <div className="flex items-center mt-1 space-x-2">
                                            <span className="text-xs text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">{vuln.repoName}</span>
                                            <span className="text-xs text-gray-600 truncate">{vuln.filePath}</span>
                                        </div>
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
                                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-400 px-4 py-2 rounded-xl transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 flex-shrink-0 ml-4 opacity-0 group-hover/item:opacity-100 transform translate-x-2 group-hover/item:translate-x-0"
                                >
                                    RESOLVE
                                </button>
                            </motion.div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                    <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
                                </div>
                                <p className="text-white font-bold text-lg">System Secure</p>
                                <p className="text-gray-500 text-sm mt-1 max-w-xs">No high-priority vulnerabilities detected in your repositories.</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-[#050505]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

                    <h2 className="text-lg font-bold text-white mb-6 flex items-center relative z-10 font-heading tracking-tight">
                        <div className="p-2 bg-blue-500/10 rounded-lg mr-3 border border-blue-500/20">
                            <TrendingUpIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        SECURITY METRICS
                    </h2>
                    <div className="relative z-10 -ml-2">
                        <TrendChart data={stats.trendData} />
                    </div>
                </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-[#050505]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl"
            >
                <h2 className="text-lg font-bold text-white mb-6 flex items-center font-heading tracking-tight">
                    <div className="p-2 bg-violet-500/10 rounded-lg mr-3 border border-violet-500/20">
                        <HistoryIcon className="w-5 h-5 text-violet-400" />
                    </div>
                    SYSTEM LOGS
                </h2>
                <div className="space-y-1">
                    {stats.recentActivity.length > 0 ? stats.recentActivity.map((log, i) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.05 }}
                            className="flex items-center justify-between py-3 px-4 hover:bg-white/5 rounded-xl transition-colors border border-transparent hover:border-white/5 group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                                    {getActivityIcon(log.type)}
                                </div>
                                <p className="text-sm text-gray-400 group-hover:text-white transition-colors font-medium">{log.text}</p>
                            </div>
                            <span className="text-xs text-gray-600 font-mono group-hover:text-gray-500">{log.time}</span>
                        </motion.div>
                    )) : (
                        <p className="text-center py-8 text-gray-500 text-sm font-mono">NO RECENT ACTIVITY LOGGED</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default DeveloperCommandCenter;