import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Repository, DashboardView } from '../types';
import { PlusIcon, RepoHealthIcon, GithubIcon, SettingsIcon, SearchIcon } from './icons';
import RepoCard from './RepoCard';
import AddRepoModal from './AddRepoModal';
import { useToast } from './ToastContext';
import { startReview, stopReview } from '../services/reviewService';
import { motion } from 'framer-motion';

const MissingConnectionPrompt: React.FC<{ onNavigateToSettings: () => void }> = ({ onNavigateToSettings }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center text-center bg-[#0A0A0A] rounded-2xl p-16 mt-8 border border-white/5"
    >
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <GithubIcon className="w-10 h-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Connect your GitHub Account</h2>
        <p className="mt-3 max-w-md text-gray-500 text-sm leading-relaxed">
            To manage your repositories, please connect your GitHub account via the settings page. This allows Sentinel to fetch your repository data securely.
        </p>
        <motion.button
            onClick={onNavigateToSettings}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-medium rounded-xl flex items-center space-x-2 hover:shadow-lg hover:shadow-blue-500/20 transition-shadow"
        >
            <SettingsIcon className="w-5 h-5" />
            <span>Go to Settings</span>
        </motion.button>
    </motion.div>
);

const EmptyState: React.FC<{ onAddRepo: () => void }> = ({ onAddRepo }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center text-center bg-[#0A0A0A] rounded-2xl p-16 h-[60vh] border border-white/5"
    >
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
            <RepoHealthIcon className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">No Repositories Added</h2>
        <p className="mt-3 max-w-md text-gray-500 text-sm">Get started by adding your first GitHub repository.</p>
        <motion.button
            onClick={onAddRepo}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium rounded-xl flex items-center space-x-2 hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow"
        >
            <PlusIcon className="w-5 h-5" />
            <span>Add Repository</span>
        </motion.button>
    </motion.div>
);

interface RepositoriesDashboardProps {
    user: User | null;
    setActiveView: (view: DashboardView) => void;
    repos: Repository[];
    setRepos: React.Dispatch<React.SetStateAction<Repository[]>>;
}

export const RepositoriesDashboard: React.FC<RepositoriesDashboardProps> = ({ user, repos, setRepos }) => {
    const navigate = useNavigate();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();

    const handleAddRepos = (newReposFromApi: Repository[]) => {
        const sanitizedNewRepos = newReposFromApi.map(repo => ({
            id: repo.id, name: repo.name, full_name: repo.full_name, description: repo.description,
            language: repo.language, stargazers_count: repo.stargazers_count, watchers_count: repo.watchers_count,
            open_issues_count: repo.open_issues_count, private: repo.private, autoReview: false, lastReview: 'Never',
        }));

        setRepos(prevRepos => {
            const existingIds = new Set(prevRepos.map(r => r.id));
            const uniqueNewRepos = sanitizedNewRepos.filter(r => !existingIds.has(r.id));
            return [...prevRepos, ...uniqueNewRepos];
        });

        if (sanitizedNewRepos.length > 0) {
            const message = `Added ${sanitizedNewRepos.length} new repositor${sanitizedNewRepos.length > 1 ? 'ies' : 'y'}.`;
            addToast(message, 'success');
        }
    };

    const handleToggleAutoReview = (repoId: number, enabled: boolean) => {
        let repoName = '';
        setRepos(prevRepos => prevRepos.map(repo => {
            if (repo.id === repoId) {
                repoName = repo.name;
                return { ...repo, autoReview: enabled };
            }
            return repo;
        }));

        if (enabled) startReview(repoId, repoName);
        else stopReview(repoId, repoName);

        addToast(`Auto-review ${enabled ? 'enabled' : 'disabled'} for ${repoName}.`, 'success');
    };

    const filteredRepos = useMemo(() => repos.filter(repo =>
        repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [repos, searchTerm]);


    if (!user?.github) {
        return <MissingConnectionPrompt onNavigateToSettings={() => navigate('/app/settings')} />;
    }

    if (repos.length === 0) {
        return (
            <>
                {isAddModalOpen && <AddRepoModal onClose={() => setIsAddModalOpen(false)} onAddRepos={handleAddRepos} existingRepoIds={repos.map(r => r.id)} />}
                <EmptyState onAddRepo={() => setIsAddModalOpen(true)} />
            </>
        );
    }

    return (
        <div className="h-full w-full space-y-6">
            {isAddModalOpen && <AddRepoModal onClose={() => setIsAddModalOpen(false)} onAddRepos={handleAddRepos} existingRepoIds={repos.map(r => r.id)} />}

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold text-white">Repositories</h1>
                    <p className="text-gray-500 text-sm mt-1">{repos.length} repositories tracked</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full md:w-56 bg-[#0A0A0A] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                    {/* Add Button */}
                    <motion.button
                        onClick={() => setIsAddModalOpen(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium rounded-xl flex items-center space-x-2 hover:shadow-lg hover:shadow-emerald-500/20 transition-shadow text-sm"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Repository</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* Repository Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
                {filteredRepos.map((repo, index) => (
                    <motion.div
                        key={repo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <RepoCard
                            repo={repo}
                            onToggleAutoReview={handleToggleAutoReview}
                            onViewPulse={() => {
                                localStorage.setItem('sentinel-gitops-preload', JSON.stringify({ repoUrl: `https://github.com/${repo.full_name}` }));
                                navigate('/app/gitops');
                            }}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* No Results */}
            {filteredRepos.length === 0 && searchTerm && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No repositories matching "{searchTerm}"</p>
                </div>
            )}
        </div>
    );
};
