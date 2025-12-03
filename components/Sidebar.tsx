import React from 'react';
import {
    StudioIcon,
    GitBranchIcon,
    SettingsIcon,
    HistoryIcon,
    RepoIcon,
    DocsIcon,
    PullRequestIcon,
    BrainCircuitIcon,
    ImageIcon,
    CommandLineIcon,
    DoubleArrowLeftIcon,
    DoubleArrowRightIcon,
    DocumentTextIcon,
    TrendingUpIcon,
    AlertTriangleIcon,
    DatabaseZapIcon,
    DocumentPlusIcon
} from './icons';
import { DashboardView } from '../types';
import { motion } from 'framer-motion';

interface NavLinkProps {
    id: DashboardView;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    isCollapsed: boolean;
    onClick: (id: DashboardView) => void;
}

const NavLink: React.FC<NavLinkProps> = ({ id, label, icon, isActive, isCollapsed, onClick }) => {
    const activeClasses = "bg-brand-purple/10 text-brand-purple dark:bg-brand-purple/20 dark:text-white";
    const inactiveClasses = "text-medium-dark-text dark:text-medium-text hover:bg-gray-200 dark:hover:bg-dark-primary hover:text-dark-text dark:hover:text-white";

    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center w-full p-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
            title={label}
        >
            <span className="flex-shrink-0 w-5 h-5">{icon}</span>
            <motion.span
                className="ml-4 truncate"
                animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
                transition={{ duration: 0.2, delay: isCollapsed ? 0 : 0.1 }}
            >
                {label}
            </motion.span>
        </button>
    );
};


interface SidebarProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    isCollapsed: boolean;
    setIsCollapsed: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isCollapsed, setIsCollapsed }) => {

    // FEAT: Overhauled nav items to reflect the new, functional feature set.
    const mainNavItems = [
        { id: 'developerCommandCenter' as DashboardView, label: 'Command Center', icon: <TrendingUpIcon /> },
        { id: 'repositories' as DashboardView, label: 'Repositories', icon: <RepoIcon /> },
    ];

    const securityToolsNavItems = [
        { id: 'studio' as DashboardView, label: 'Studio Sandbox', icon: <StudioIcon /> },
        { id: 'gitops' as DashboardView, label: 'GitOps Scanner', icon: <GitBranchIcon /> },
        { id: 'commits' as DashboardView, label: 'Commit History', icon: <HistoryIcon /> },
        { id: 'pushpull' as DashboardView, label: 'PR Review', icon: <PullRequestIcon /> },
    ];

    const aiAgentsNavItems = [
        { id: 'refactor' as DashboardView, label: 'Auto-Refactor Agent', icon: <BrainCircuitIcon /> },
        { id: 'workflowStreamliner' as DashboardView, label: 'Repo Chatbot', icon: <CommandLineIcon /> },
        { id: 'repoReport' as DashboardView, label: 'Repo Report', icon: <DocumentTextIcon /> },
        { id: 'imageGenerator' as DashboardView, label: 'Image Generator', icon: <ImageIcon /> },
    ];

    const productivityNavItems = [
        { id: 'readmeGenerator' as DashboardView, label: 'README Generator', icon: <DocumentPlusIcon /> },
    ];

    const accountNavItems = [
        { id: 'docs' as DashboardView, label: 'User Guide', icon: <DocsIcon /> },
        { id: 'smartAlerts' as DashboardView, label: 'Smart Alerts', icon: <AlertTriangleIcon /> },
        { id: 'settings' as DashboardView, label: 'Settings', icon: <SettingsIcon /> },
    ];

    const NavSection: React.FC<{ title?: string, items: { id: DashboardView, label: string, icon: React.ReactNode }[] }> = ({ title, items }) => (
        <div>
            {title && (
                <motion.p
                    className="px-3 pt-6 pb-2 text-xs font-semibold text-medium-dark-text dark:text-medium-text uppercase tracking-wider"
                    animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
                    transition={{ duration: 0.2, delay: isCollapsed ? 0 : 0.1 }}
                >
                    {title}
                </motion.p>
            )}
            <ul className="space-y-1">
                {items.map(item => <li key={item.id}><NavLink {...item} isCollapsed={isCollapsed} isActive={activeView === item.id} onClick={setActiveView} /></li>)}
            </ul>
        </div>
    );

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? '5rem' : '18rem' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-light-secondary dark:bg-dark-secondary border-r border-gray-200 dark:border-white/10 flex flex-col h-full fixed top-0 left-0 pt-16 z-40"
        >
            <div className="flex-grow p-3 overflow-y-auto overflow-x-hidden">
                <NavSection items={mainNavItems} />
                <NavSection title="Security Tools" items={securityToolsNavItems} />
                <NavSection title="AI Agents" items={aiAgentsNavItems} />
                <NavSection title="Productivity" items={productivityNavItems} />
            </div>

            <div className="p-3 mt-auto border-t border-gray-200 dark:border-white/10">
                <NavSection items={accountNavItems} />
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center p-2.5 mt-2 rounded-lg text-medium-dark-text dark:text-medium-text hover:bg-gray-200 dark:hover:bg-dark-primary"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <DoubleArrowRightIcon className="w-5 h-5" /> : <DoubleArrowLeftIcon className="w-5 h-5" />}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;