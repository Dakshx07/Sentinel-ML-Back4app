import React, { useState, useEffect } from 'react';
import { AlertTriangleIcon, PullRequestIcon, ShieldIcon, MailIcon, InfoIcon, SpinnerIcon } from './icons';
import { useToast } from './ToastContext';
import { AlertRecord } from '../types';
import { getAllAlerts } from '../services/dbService';

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
        switch(type) {
            case 'PR_COMMENT':
                return <PullRequestIcon className="w-5 h-5 text-brand-purple" />;
            default:
                return <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />;
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
        <div className="h-full w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <div className="flex items-center space-x-3">
                <AlertTriangleIcon className="w-8 h-8 text-brand-purple" />
                <div>
                    <h1 className="text-3xl font-bold text-dark-text dark:text-white font-heading">Smart Alerts</h1>
                    <p className="mt-1 text-medium-dark-text dark:text-medium-text">A log of important events and findings from Sentinel.</p>
                </div>
            </div>
            
            <div className="glass-effect p-6 rounded-lg">
                <h2 className="text-xl font-bold text-dark-text dark:text-white font-heading mb-4">Notification Channels</h2>
                <div className="p-4 rounded-lg flex items-start space-x-3 bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500">
                     <InfoIcon className="w-6 h-6 flex-shrink-0 mt-1 text-blue-500" />
                    <div>
                        <h3 className="font-bold text-dark-text dark:text-white">Email & Slack Integration</h3>
                        <p className="text-sm text-medium-dark-text dark:text-medium-text mt-1">
                            Fully automated, real-time email and Slack notifications require a backend server. This is available on our Enterprise plan or can be configured by running the local bot server included with the project.
                            <a href="#" onClick={() => addToast('See documentation for bot server setup.', 'info')} className="ml-1 text-brand-cyan hover:underline">Learn more</a>.
                        </p>
                    </div>
                </div>
                 <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <MailIcon className="w-6 h-6 text-brand-cyan" />
                        <span className="font-semibold text-dark-text dark:text-white">Email Alerts (Client-Side)</span>
                    </div>
                     <a href="mailto:support@sentinel.example.com?subject=Enable Email Alerts" className="btn-secondary text-sm py-1.5 px-3">
                        Request via Email
                    </a>
                </div>
            </div>

            <div className="glass-effect p-6 rounded-lg">
                <h2 className="text-xl font-bold text-dark-text dark:text-white font-heading mb-4">Recent Events</h2>
                 {isLoading ? (
                    <div className="flex justify-center items-center py-8"><SpinnerIcon className="w-8 h-8" /></div>
                 ) : alerts.length === 0 ? (
                    <div className="text-center py-8 text-medium-dark-text dark:text-medium-text">
                        <p>No events have been logged yet.</p>
                        <p className="text-sm mt-1">Run a PR Review or GitOps Scan to see events here.</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {alerts.map((alert) => (
                             <li key={alert.id} className="flex items-start space-x-4 pb-4 border-b border-gray-200 dark:border-white/10 last:border-b-0 last:pb-0">
                                <div className="mt-1">{getIconForType(alert.type)}</div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-dark-text dark:text-light-text">{alert.repoFullName}</p>
                                    <p className="text-sm text-medium-dark-text dark:text-medium-text">{alert.details}</p>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                    <span className="text-xs text-medium-dark-text dark:text-medium-text">{formatTimeAgo(alert.timestamp)}</span>
                                     {alert.url && (
                                        <a href={alert.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-cyan hover:underline mt-1">View Details</a>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SmartAlerts;