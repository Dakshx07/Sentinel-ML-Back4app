import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Repository, DashboardView } from '../types';
import { PlusIcon, RepoHealthIcon, GithubIcon, SettingsIcon, SearchIcon, SparklesIcon } from './icons';
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
        className="flex flex-col items-center justify-center text-center bg-[#050505]/80 backdrop-blur-xl rounded-3xl p-16 mt-8 border border-white/10 shadow-2xl relative overflow-hidden"
    >
        <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.2)] relative z-10">
            <GithubIcon className="w-12 h-12 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white font-heading tracking-tight relative z-10">Connect GitHub Account</h2>
        <p className="mt-4 max-w-md text-gray-400 text-sm leading-relaxed relative z-10">
            To manage your repositories, please connect your GitHub account via the settings page. This allows Sentinel to fetch your repository data securely.
        </p>
        <motion.button
            onClick={onNavigateToSettings}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-10 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center space-x-3 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all relative z-10"
        >
            <SettingsIcon className="w-5 h-5" />
            <span>CONFIGURE SETTINGS</span>
        </motion.button>
    </motion.div>
);

const EmptyState: React.FC<{ onAddRepo: () => void }> = ({ onAddRepo }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center text-center bg-[#050505]/80 backdrop-blur-xl rounded-3xl p-16 h-[60vh] border border-white/10 shadow-2xl relative overflow-hidden group"
    >
        <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />

        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)] relative z-10 group-hover:scale-110 transition-transform duration-500">
            <SparklesIcon className="w-12 h-12 text-emerald-400 animate-pulse" />
        </div>

        <h2 className="text-3xl font-bold text-white font-heading tracking-tight relative z-10">No Repositories Found</h2>
        <p className="mt-4 max-w-md text-gray-400 text-sm relative z-10">
            Your dashboard is empty. Import a repository to start analyzing code quality and security vulnerabilities.
        </p>

        <motion.button
            onClick={onAddRepo}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-10 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center space-x-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all relative z-10"
        >
            <PlusIcon className="w-5 h-5" />
            <span>ADD REPOSITORY</span>
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
        <div className="h-full w-full space-y-8 p-2">
            {isAddModalOpen && <AddRepoModal onClose={() => setIsAddModalOpen(false)} onAddRepos={handleAddRepos} existingRepoIds={repos.map(r => r.id)} />}

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
                <div>
                    <h1 className="text-4xl font-black text-white font-heading tracking-tighter">REPOSITORIES</h1>
                    <p className="text-gray-400 text-sm mt-2 font-mono flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                        {repos.length} REPOSITORIES TRACKED
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-grow md:flex-grow-0">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="SEARCH REPOSITORIES..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 bg-[#050505] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                        />
                    </div>
                    {/* Add Button */}
                    <motion.button
                        onClick={() => setIsAddModalOpen(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center space-x-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all text-sm whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">ADD NEW</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* Repository Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
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
                <div className="text-center py-20 bg-[#050505]/50 rounded-3xl border border-white/5 border-dashed">
                    <p className="text-gray-500 font-mono">NO REPOSITORIES MATCHING "{searchTerm.toUpperCase()}"</p>
                </div>
            )}
        </div>
    );
};
