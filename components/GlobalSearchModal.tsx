import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Repository, DashboardView } from '../types';
import { 
    RepoIcon, StudioIcon, GitBranchIcon, HistoryIcon, SettingsIcon,
    DocsIcon, PullRequestIcon, BrainCircuitIcon,
    CpuChipIcon, ImageIcon, CommandLineIcon, SearchIcon, DocumentTextIcon,
    TrendingUpIcon, AlertTriangleIcon, FileCodeIcon, DatabaseZapIcon
} from './icons';
import { AnimatePresence, motion } from 'framer-motion';

interface SearchItem {
  id: string;
  type: 'nav' | 'repo';
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  repos: Repository[];
  onNavigate: (view: DashboardView, options?: { repoFullName?: string }) => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, repos, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const NAV_ITEMS = useMemo(() => [
        { id: 'developerCommandCenter', title: 'Command Center', description: 'View your main developer dashboard', icon: <TrendingUpIcon className="w-5 h-5" />, view: 'developerCommandCenter' as DashboardView },
        { id: 'repositories', title: 'Repositories', description: 'Manage your tracked repositories', icon: <RepoIcon className="w-5 h-5" />, view: 'repositories' as DashboardView },
        { id: 'studio', title: 'Studio Sandbox', description: 'Analyze code snippets and samples', icon: <StudioIcon className="w-5 h-5" />, view: 'studio' as DashboardView },
        { id: 'gitops', title: 'GitOps Scanner', description: 'Scan a full GitHub repository', icon: <GitBranchIcon className="w-5 h-5" />, view: 'gitops' as DashboardView },
        { id: 'commits', title: 'Commit History', description: 'Analyze recent commit history for secrets', icon: <HistoryIcon className="w-5 h-5" />, view: 'commits' as DashboardView },
        { id: 'pushpull', title: 'PR Review', description: 'Perform an interactive PR review', icon: <PullRequestIcon className="w-5 h-5" />, view: 'pushpull' as DashboardView },
        { id: 'refactor', title: 'Auto-Refactor Agent', description: 'Use AI to refactor code files', icon: <BrainCircuitIcon className="w-5 h-5" />, view: 'refactor' as DashboardView },
        { id: 'workflowStreamliner', title: 'Repo Chatbot', description: 'Chat with your repository context', icon: <CommandLineIcon className="w-5 h-5" />, view: 'workflowStreamliner' as DashboardView },
        { id: 'imageGenerator', title: 'Image Generator', description: 'Create images from prompts', icon: <ImageIcon className="w-5 h-5" />, view: 'imageGenerator' as DashboardView },
        { id: 'repoReport', title: 'Repo Report', description: 'Generate an AI summary report for a repository', icon: <DocumentTextIcon className="w-5 h-5" />, view: 'repoReport' as DashboardView },
        { id: 'smartAlerts', title: 'Smart Alerts', description: 'View automated action history', icon: <AlertTriangleIcon className="w-5 h-5" />, view: 'smartAlerts' as DashboardView },
        { id: 'docs', title: 'User Guide', description: 'Read the documentation', icon: <DocsIcon className="w-5 h-5" />, view: 'docs' as DashboardView },
        { id: 'settings', title: 'Settings', description: 'Configure API keys and preferences', icon: <SettingsIcon className="w-5 h-5" />, view: 'settings' as DashboardView },
    ], []);

    const searchItems: SearchItem[] = useMemo(() => {
        const lowerQuery = query.toLowerCase();
        
        const filteredNav = NAV_ITEMS
            .filter(item => item.title.toLowerCase().includes(lowerQuery) || (item.description && item.description.toLowerCase().includes(lowerQuery)))
            .map(item => ({
                id: item.id,
                type: 'nav' as const,
                title: item.title,
                description: item.description,
                icon: item.icon,
                action: () => onNavigate(item.view),
            }));

        const filteredRepos = repos
            .filter(repo => repo.full_name.toLowerCase().includes(lowerQuery))
            .map(repo => ({
                id: repo.id.toString(),
                type: 'repo' as const,
                title: repo.full_name,
                description: `Scan with GitOps Scanner`,
                icon: <GitBranchIcon className="w-5 h-5" />,
                action: () => {
                    localStorage.setItem('sentinel-gitops-preload', JSON.stringify({ repoUrl: `https://github.com/${repo.full_name}` }));
                    onNavigate('gitops');
                },
            }));

        return [...filteredNav, ...filteredRepos];
    }, [query, repos, onNavigate, NAV_ITEMS]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % searchItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + searchItems.length) % searchItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (searchItems[selectedIndex]) {
                    searchItems[selectedIndex].action();
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, searchItems, selectedIndex]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="bg-light-secondary dark:bg-dark-secondary rounded-lg shadow-xl w-full max-w-2xl flex flex-col border border-gray-200 dark:border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative p-4 border-b border-gray-200 dark:border-white/10">
                            <SearchIcon className="w-5 h-5 absolute left-7 top-1/2 -translate-y-1/2 text-medium-dark-text dark:text-medium-text" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search for pages or repositories..."
                                className="w-full bg-transparent border-none pl-10 p-2 text-dark-text dark:text-white focus:outline-none placeholder:text-medium-dark-text dark:placeholder:text-medium-text"
                            />
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {searchItems.length > 0 ? (
                                <ul>
                                    {searchItems.map((item, index) => (
                                        <li key={`${item.type}-${item.id}`}>
                                            <button
                                                onClick={() => { item.action(); onClose(); }}
                                                className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${selectedIndex === index ? 'bg-brand-purple/20' : 'hover:bg-gray-200/50 dark:hover:bg-white/5'}`}
                                            >
                                                <div className={`flex-shrink-0 p-1.5 rounded-md ${selectedIndex === index ? 'bg-brand-purple text-white' : 'bg-gray-200 dark:bg-white/10 text-medium-dark-text dark:text-medium-text'}`}>
                                                    {item.icon}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-semibold text-dark-text dark:text-white truncate">{item.title}</p>
                                                    {item.description && <p className="text-xs text-medium-dark-text dark:text-medium-text truncate">{item.description}</p>}
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="p-8 text-center text-medium-dark-text dark:text-medium-text">No results found.</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
export default GlobalSearchModal;