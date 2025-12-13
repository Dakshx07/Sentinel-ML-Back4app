import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import {
    ShieldIcon,
    RepoIcon,
    PullRequestIcon,
    ActivityIcon,
    ServerIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    CpuChipIcon
} from './icons';
import { Repository, DashboardView } from '../types';
import { getUserRepos, getMonitoredReposHealth, RepoHealthData } from '../services/githubService';
import { getRecentAlerts } from '../services/dbService';

interface DeveloperCommandCenterProps {
    setActiveView: (view: DashboardView) => void;
    repos: Repository[];
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const DeveloperCommandCenter: React.FC<DeveloperCommandCenterProps> = ({ setActiveView, repos }) => {
    const [healthData, setHealthData] = useState<RepoHealthData[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [systemStatus, setSystemStatus] = useState<'online' | 'degraded' | 'offline'>('online');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch health data for monitored repos
                const health = await getMonitoredReposHealth(repos);
                setHealthData(health);

                // Fetch recent alerts/activity
                const alerts = await getRecentAlerts(10);
                setRecentActivity(alerts);

                // Simulate system check
                setSystemStatus('online');
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
                setSystemStatus('degraded');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [repos]);

    // Calculate aggregate metrics
    const totalCritical = healthData.reduce((acc, curr) => acc + curr.critical, 0);
    const totalHigh = healthData.reduce((acc, curr) => acc + curr.high, 0);
    const totalIssues = healthData.reduce((acc, curr) => acc + curr.total, 0);
    const securityScore = Math.max(0, 100 - (totalCritical * 10 + totalHigh * 5));

    // Prepare chart data
    const pieData = [
        { name: 'Secure', value: Math.max(1, 100 - totalIssues) }, // Placeholder logic
        { name: 'Low', value: totalIssues - totalCritical - totalHigh },
        { name: 'High', value: totalHigh },
        { name: 'Critical', value: totalCritical },
    ].filter(d => d.value > 0);

    // Mock trend data (replace with real historical data if available)
    const trendData = [
        { name: 'Mon', issues: totalIssues + 5, commits: 12 },
        { name: 'Tue', issues: totalIssues + 2, commits: 18 },
        { name: 'Wed', issues: totalIssues - 1, commits: 8 },
        { name: 'Thu', issues: totalIssues + 3, commits: 24 },
        { name: 'Fri', issues: totalIssues, commits: 15 },
        { name: 'Sat', issues: Math.max(0, totalIssues - 2), commits: 5 },
        { name: 'Sun', issues: Math.max(0, totalIssues - 4), commits: 2 },
    ];

    return (
        <div className="h-full w-full flex flex-col space-y-6 animate-fade-in-up p-6 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white font-heading tracking-tight">Command Center</h1>
                    <p className="text-gray-400 text-sm">System Overview & Security Metrics</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                        <div className={`w-2 h-2 rounded-full ${systemStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs font-mono text-gray-300 uppercase">System {systemStatus}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 font-mono">LAST UPDATED</p>
                        <p className="text-sm text-white font-mono">{new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>

            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Monitored Repos"
                    value={repos.length}
                    icon={<RepoIcon className="w-6 h-6 text-blue-400" />}
                    trend="+2 this week"
                    trendUp={true}
                    color="blue"
                />
                <MetricCard
                    title="Security Score"
                    value={`${securityScore}%`}
                    icon={<ShieldIcon className="w-6 h-6 text-emerald-400" />}
                    trend={securityScore > 80 ? "Optimal" : "Needs Attention"}
                    trendUp={securityScore > 80}
                    color="emerald"
                />
                <MetricCard
                    title="Critical Issues"
                    value={totalCritical}
                    icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-500" />}
                    trend={`${totalCritical > 0 ? 'Action Required' : 'All Clear'}`}
                    trendUp={totalCritical === 0}
                    color="red"
                />
                <MetricCard
                    title="Active Scans"
                    value={healthData.length}
                    icon={<ActivityIcon className="w-6 h-6 text-purple-400" />}
                    trend="Running"
                    trendUp={true}
                    color="purple"
                />
            </div>

            {/* Middle Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-80">
                {/* Security Distribution */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Security Health</h3>
                    <div className="flex-grow relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">{totalIssues}</p>
                                <p className="text-xs text-gray-500">Total Issues</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Trend */}
                <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Activity & Issues Trend</h3>
                    <div className="flex-grow">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#666" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="issues" stroke="#EF4444" fillOpacity={1} fill="url(#colorIssues)" strokeWidth={2} />
                                <Area type="monotone" dataKey="commits" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCommits)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: System Logs & Repo Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                {/* Repo Status List */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden flex flex-col">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Repository Status</h3>
                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {healthData.map((repo, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <RepoIcon className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white truncate max-w-[150px]">{repo.fullName}</p>
                                        <p className="text-xs text-gray-500">Updated just now</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">Issues</p>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-red-400 text-xs font-bold">{repo.critical} Crit</span>
                                            <span className="text-orange-400 text-xs font-bold">{repo.high} High</span>
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${repo.critical > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                </div>
                            </div>
                        ))}
                        {healthData.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm">No repositories monitored.</div>
                        )}
                    </div>
                </div>

                {/* System Logs */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden flex flex-col">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">System Logs</h3>
                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 font-mono text-xs">
                        {recentActivity.map((log, idx) => (
                            <div key={idx} className="flex space-x-3 text-gray-300 border-l-2 border-white/10 pl-3 py-1 hover:bg-white/5 transition-colors rounded-r">
                                <span className="text-gray-500 flex-shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`flex-shrink-0 font-bold ${log.type === 'CRITICAL' ? 'text-red-500' : 'text-blue-400'}`}>[{log.type}]</span>
                                <span className="truncate">{log.details}</span>
                            </div>
                        ))}
                        <div className="flex space-x-3 text-gray-300 border-l-2 border-emerald-500/50 pl-3 py-1">
                            <span className="text-gray-500 flex-shrink-0">{new Date().toLocaleTimeString()}</span>
                            <span className="text-emerald-400 flex-shrink-0 font-bold">[SYSTEM]</span>
                            <span>Dashboard initialized. Monitoring active.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend: string;
    trendUp: boolean;
    color: string;
}> = ({ title, value, icon, trend, trendUp, color }) => (
    <motion.div
        whileHover={{ y: -2 }}
        className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 relative overflow-hidden group`}
    >
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-${color}-500/20`} />
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-${color}-500/10 border border-${color}-500/20`}>
                    {icon}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {trend}
                </span>
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white font-heading">{value}</p>
        </div>
    </motion.div>
);

export default DeveloperCommandCenter;