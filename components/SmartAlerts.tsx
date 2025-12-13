import React, { useState, useEffect } from 'react';
import { AlertTriangleIcon, PullRequestIcon, ShieldIcon, MailIcon, InfoIcon, SpinnerIcon, BellIcon, SlackIcon, CheckCircleIcon } from './icons';
import { useToast } from './ToastContext';
import { AlertRecord } from '../types';
import { getAllAlerts } from '../services/dbService';
import { motion, AnimatePresence } from 'framer-motion';

const SmartAlerts: React.FC = () => {
    const { addToast } = useToast();
    const [alerts, setAlerts] = useState<AlertRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const data = await getAllAlerts();
                setAlerts(data);
            } catch (e) {
                console.error("Failed to fetch alerts:", e);
                addToast("Could not load alerts from database.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAlerts();
    }, [addToast]);

    const getIconForType = (type: AlertRecord['type']) => {
        switch (type) {
            case 'PR_COMMENT':
                return <PullRequestIcon className="w-4 h-4 text-emerald-400" />;
            default:
                return <AlertTriangleIcon className="w-4 h-4 text-amber-400" />;
        }
    };

    const formatTimeAgo = (timestamp: number): string => {
        const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="h-full w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <AlertTriangleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white font-heading tracking-tight">Smart Alerts</h1>
                        <p className="text-sm text-gray-400">Real-time intelligence and security event logging.</p>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-3">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">System Operational</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Notification Channels Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                        <h2 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wider mb-6">Active Channels</h2>

                        <div className="space-y-4">
                            <div className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-500/20 rounded-lg">
                                            <MailIcon className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="font-bold text-white text-sm">Email Alerts</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-gray-600" title="Disabled" />
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed mb-3">Get critical security summaries delivered to your inbox.</p>
                                <button className="w-full py-2 text-xs font-bold text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors">
                                    Configure SMTP
                                </button>
                            </div>

                            <div className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-purple-500/20 rounded-lg">
                                            <SlackIcon className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <span className="font-bold text-white text-sm">Slack Bot</span>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-gray-600" title="Disabled" />
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed mb-3">Real-time notifications in your team's workspace.</p>
                                <button
                                    onClick={() => addToast('See documentation for bot server setup.', 'info')}
                                    className="w-full py-2 text-xs font-bold text-purple-400 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors"
                                >
                                    Setup Webhook
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-3">
                            <InfoIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-200/80 leading-relaxed">
                                Real-time notifications require the local bot server to be running. Check the <span className="text-white font-bold cursor-pointer hover:underline" onClick={() => addToast('Navigate to Documentation', 'info')}>Documentation</span> for setup instructions.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Recent Events Card */}
                <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wider">Event Log</h2>
                        <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-gray-500">Live Updates</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2">
                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center h-full space-y-4">
                                <SpinnerIcon className="w-8 h-8 text-amber-500 animate-spin" />
                                <p className="text-sm text-gray-500">Syncing with Sentinel Core...</p>
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                    <CheckCircleIcon className="w-10 h-10 text-green-500" />
                                </div>
                                <h3 className="text-lg font-bold text-white">All Clear</h3>
                                <p className="text-sm text-gray-500 mt-1">No security events or alerts detected.</p>
                                <p className="text-xs text-gray-600 mt-4 max-w-xs mx-auto">Run a PR Review or GitOps Scan to populate this log with findings.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                <AnimatePresence>
                                    {alerts.map((alert, index) => (
                                        <motion.li
                                            key={alert.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group flex items-start space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${alert.type === 'PR_COMMENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {getIconForType(alert.type)}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-bold text-white text-sm truncate pr-4">{alert.repoFullName}</p>
                                                    <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">{formatTimeAgo(alert.timestamp)}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 group-hover:text-gray-300 transition-colors">{alert.details}</p>
                                                {alert.url && (
                                                    <div className="mt-3">
                                                        <a
                                                            href={alert.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded-lg hover:bg-blue-500/20"
                                                        >
                                                            <span>View Context</span>
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.li>
                                    ))}
                                </AnimatePresence>
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartAlerts;