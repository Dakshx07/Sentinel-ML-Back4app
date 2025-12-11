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
    DocumentPlusIcon
} from './icons';
import { DashboardView } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface NavLinkProps {
    id: DashboardView;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    isCollapsed: boolean;
    onClick: (id: DashboardView) => void;
    accentColor?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ id, label, icon, isActive, isCollapsed, onClick, accentColor = 'blue' }) => {
    const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: '0 0 20px rgba(59,130,246,0.15)' },
        green: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: '0 0 20px rgba(16,185,129,0.15)' },
        violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', glow: '0 0 20px rgba(139,92,246,0.15)' },
        amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: '0 0 20px rgba(245,158,11,0.15)' },
        gray: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-gray-400', glow: '0 0 10px rgba(255,255,255,0.05)' },
    };

    const colors = colorClasses[accentColor] || colorClasses.blue;

    return (
        <motion.button
            onClick={() => onClick(id)}
            className={`relative flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group overflow-hidden
                ${isActive
                    ? `${colors.bg} ${colors.text} border ${colors.border}`
                    : 'text-gray-500 hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`}
            title={label}
            whileHover={{ x: isCollapsed ? 0 : 4 }}
            whileTap={{ scale: 0.97 }}
            style={isActive ? { boxShadow: colors.glow } : undefined}
        >
            {/* Shimmer effect on hover */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
            />

            <span className={`relative flex-shrink-0 w-5 h-5 transition-all duration-200 ${isActive ? colors.text : 'group-hover:text-white'}`}>
                {icon}
            </span>

            <AnimatePresence>
                {!isCollapsed && (
                    <motion.span
                        className="relative ml-3 truncate"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};


interface SidebarProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    isCollapsed: boolean;
    setIsCollapsed: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isCollapsed, setIsCollapsed }) => {

    const mainNavItems = [
        { id: 'developerCommandCenter' as DashboardView, label: 'Command Center', icon: <TrendingUpIcon />, color: 'blue' },
        { id: 'repositories' as DashboardView, label: 'Repositories', icon: <RepoIcon />, color: 'green' },
    ];

    const securityToolsNavItems = [
        { id: 'studio' as DashboardView, label: 'Studio', icon: <StudioIcon />, color: 'violet' },
        { id: 'gitops' as DashboardView, label: 'GitOps Scanner', icon: <GitBranchIcon />, color: 'blue' },
        { id: 'commits' as DashboardView, label: 'Commits', icon: <HistoryIcon />, color: 'gray' },
        { id: 'pushpull' as DashboardView, label: 'PR Review', icon: <PullRequestIcon />, color: 'green' },
    ];

    const aiAgentsNavItems = [
        { id: 'refactor' as DashboardView, label: 'Refactor', icon: <BrainCircuitIcon />, color: 'violet' },
        { id: 'workflowStreamliner' as DashboardView, label: 'Chatbot', icon: <CommandLineIcon />, color: 'blue' },
        { id: 'repoReport' as DashboardView, label: 'Report', icon: <DocumentTextIcon />, color: 'amber' },
        { id: 'imageGenerator' as DashboardView, label: 'Image Gen', icon: <ImageIcon />, color: 'violet' },
    ];

    const productivityNavItems = [
        { id: 'readmeGenerator' as DashboardView, label: 'README', icon: <DocumentPlusIcon />, color: 'green' },
    ];

    const accountNavItems = [
        { id: 'docs' as DashboardView, label: 'Docs', icon: <DocsIcon />, color: 'blue' },
        { id: 'smartAlerts' as DashboardView, label: 'Alerts', icon: <AlertTriangleIcon />, color: 'amber' },
        { id: 'settings' as DashboardView, label: 'Settings', icon: <SettingsIcon />, color: 'gray' },
    ];

    const NavSection: React.FC<{ title?: string, items: { id: DashboardView, label: string, icon: React.ReactNode, color: string }[] }> = ({ title, items }) => (
        <div className="mb-1">
            {title && !isCollapsed && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3 pt-5 pb-2 flex items-center space-x-2"
                >
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-[0.2em]">{title}</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-white/10 to-transparent" />
                </motion.div>
            )}
            {title && isCollapsed && (
                <div className="h-px my-3 mx-3 bg-white/5" />
            )}
            <ul className="space-y-0.5">
                {items.map(item => (
                    <li key={item.id}>
                        <NavLink
                            {...item}
                            isCollapsed={isCollapsed}
                            isActive={activeView === item.id}
                            onClick={setActiveView}
                            accentColor={item.color}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? '4.5rem' : '15rem' }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-0 left-0 h-full pt-24 z-40 flex flex-col"
        >
            {/* Glass background with curved edge */}
            <div className="absolute inset-0 bg-[#030303]">
                {/* Curved right edge */}
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/50 to-transparent" />
            </div>

            {/* Glowing border on right */}
            <div className="absolute right-0 top-24 bottom-0 w-[1px] bg-gradient-to-b from-blue-500/20 via-violet-500/10 to-transparent" />

            {/* Content */}
            <div className="relative flex-grow px-2 overflow-y-auto overflow-x-hidden scrollbar-hide">
                <NavSection items={mainNavItems} />
                <NavSection title="Security" items={securityToolsNavItems} />
                <NavSection title="AI" items={aiAgentsNavItems} />
                <NavSection title="Tools" items={productivityNavItems} />
            </div>

            {/* Bottom section */}
            <div className="relative p-2 mt-auto">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent mb-2" />
                <NavSection items={accountNavItems} />
                <motion.button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center p-2.5 mt-1 rounded-xl text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200 border border-transparent hover:border-blue-500/20"
                    title={isCollapsed ? "Expand" : "Collapse"}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isCollapsed ? <DoubleArrowRightIcon className="w-4 h-4" /> : <DoubleArrowLeftIcon className="w-4 h-4" />}
                </motion.button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;