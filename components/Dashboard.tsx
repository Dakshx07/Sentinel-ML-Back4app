import React, { useState, useEffect } from 'react';
import SentinelStudio from './SentinelStudio';
import GitHubScanner from './GitHubScanner';
import SettingsPage from './SettingsPage';
import CommitScanner from './CommitScanner';
import Sidebar from './Sidebar';
import { RepositoriesDashboard } from './RepositoriesDashboard';
import DocumentationDashboard from './DocumentationDashboard';
import PushPullPanel from './PushPullPanel';
import RefactorSimulator from './RefactorSimulator';
import RepoReportDashboard from './RepoReportDashboard';
import ErrorBoundary from './ErrorBoundary';
import DevWorkflowStreamliner from './DevWorkflowStreamliner';
import ImageGenerator from './ImageGenerator';
import READMEGenerator from './READMEGenerator';
import { User, DashboardView, Repository } from '../types';

import DeveloperCommandCenter from './DeveloperCommandCenter';
import SmartAlerts from './SmartAlerts';


interface DashboardProps {
    user: User | null;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    onProfileUpdate: (updatedUser: Partial<User>) => void;
    repos: Repository[];
    setRepos: React.Dispatch<React.SetStateAction<Repository[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ user, activeView, setActiveView, onProfileUpdate, repos, setRepos }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            // It collapses for tablets/mobile (< 1024px) and expands for larger screens.
            if (window.innerWidth < 1024) {
                setIsSidebarCollapsed(true);
            } else {
                setIsSidebarCollapsed(false);
            }
        };

        // Run on initial load and add listener
        handleResize();
        window.addEventListener('resize', handleResize);

        // Cleanup listener on component unmount
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const renderActiveView = () => {
        const navigateToSettings = () => setActiveView('settings');

        if (!user) {
            return <div>Loading user...</div>;
        }

        switch (activeView) {
            case 'developerCommandCenter':
                return <DeveloperCommandCenter user={user} repos={repos} setActiveView={setActiveView} />;
            case 'smartAlerts':
                return <SmartAlerts />;
            case 'repositories':
                return <RepositoriesDashboard user={user} setActiveView={setActiveView} repos={repos} setRepos={setRepos} />;
            case 'studio':
                return <SentinelStudio onNavigateToSettings={navigateToSettings} />;
            case 'gitops':
                return <GitHubScanner user={user} onNavigateToSettings={navigateToSettings} repos={repos} />;
            case 'commits':
                return <CommitScanner user={user} onNavigateToSettings={navigateToSettings} repos={repos} />;
            case 'pushpull':
                return <PushPullPanel setActiveView={setActiveView} repos={repos} />;
            case 'refactor':
                return <RefactorSimulator onNavigateToSettings={navigateToSettings} repos={repos} user={user} />;
            case 'repoReport':
                return <RepoReportDashboard repos={repos} user={user} onNavigateToSettings={navigateToSettings} />;
            case 'workflowStreamliner':
                return <DevWorkflowStreamliner repos={repos} user={user} onNavigateToSettings={navigateToSettings} />;
            case 'readmeGenerator':
                return <READMEGenerator repos={repos} user={user} onNavigateToSettings={navigateToSettings} />;
            case 'imageGenerator':
                return <ImageGenerator onNavigateToSettings={navigateToSettings} />;
            case 'settings':
                return <SettingsPage user={user} onProfileUpdate={onProfileUpdate} />;
            case 'docs':
                return <DocumentationDashboard />;
            default:
                return <DeveloperCommandCenter user={user} repos={repos} setActiveView={setActiveView} />;
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />
            <main
                className="absolute top-24 right-0 bottom-0 overflow-y-auto p-6 md:p-8 transition-all duration-300 bg-black"
                style={{ left: isSidebarCollapsed ? '4.5rem' : '16rem' }}
            >
                <ErrorBoundary>
                    {renderActiveView()}
                </ErrorBoundary>
            </main>
        </div>
    );
};

export default Dashboard;