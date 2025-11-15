import React, { useState, useMemo } from 'react';
import { User, Repository, DashboardView } from '../types';
import { PlusIcon, RepoHealthIcon, GithubIcon, SettingsIcon } from './icons';
import RepoCard from './RepoCard';
import AddRepoModal from './AddRepoModal';
import { useToast } from './ToastContext';
import { startReview, stopReview } from '../services/reviewService';

const MissingConnectionPrompt: React.FC<{ onNavigateToSettings: () => void }> = ({ onNavigateToSettings }) => (
    <div className="flex flex-col items-center justify-center text-center glass-effect rounded-lg p-12 mt-8">
        <GithubIcon className="w-16 h-16 text-medium-dark-text dark:text-medium-text opacity-50 mb-4" />
        <h2 className="text-2xl font-bold text-dark-text dark:text-white font-heading">Connect your GitHub Account</h2>
        <p className="mt-2 max-w-sm text-medium-dark-text dark:text-medium-text">
            To manage your repositories, please connect your GitHub account via the settings page. This allows Sentinel to fetch your repository data securely.
        </p>
        <button
            onClick={onNavigateToSettings}
            className="btn-primary flex items-center space-x-2 py-2 px-4 mt-6"
        >
            <SettingsIcon className="w-5 h-5" />
            <span>Go to Settings</span>
        </button>
    </div>
);

interface RepositoriesDashboardProps {
    user: User | null;
    setActiveView: (view: DashboardView) => void;
    repos: Repository[];
    setRepos: React.Dispatch<React.SetStateAction<Repository[]>>;
}

export const RepositoriesDashboard: React.FC<RepositoriesDashboardProps> = ({ user, setActiveView, repos, setRepos }) => {
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
        return <MissingConnectionPrompt onNavigateToSettings={() => setActiveView('settings')} />;
    }
    
    if (repos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center glass-effect rounded-lg p-12 h-full">
                {isAddModalOpen && <AddRepoModal onClose={() => setIsAddModalOpen(false)} onAddRepos={handleAddRepos} existingRepoIds={repos.map(r => r.id)} />}
                <RepoHealthIcon className="w-16 h-16 text-medium-dark-text dark:text-medium-text opacity-50 mb-4" />
                <h2 className="text-2xl font-bold text-dark-text dark:text-white font-heading">No Repositories Added</h2>
                <p className="mt-2 max-w-sm text-medium-dark-text dark:text-medium-text">Get started by adding your first GitHub repository.</p>
                <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center space-x-2 py-2 px-4 mt-6">
                    <PlusIcon className="w-5 h-5" />
                    <span>Add Repository</span>
                </button>
            </div>
        );
    }

    return (
        <div className="h-full w-full animate-fade-in-up">
            {isAddModalOpen && <AddRepoModal onClose={() => setIsAddModalOpen(false)} onAddRepos={handleAddRepos} existingRepoIds={repos.map(r => r.id)} />}
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h1 className="text-3xl font-bold text-dark-text dark:text-white font-heading">Repositories</h1>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <input type="text" placeholder="Search repositories..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 bg-light-secondary dark:bg-dark-secondary border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm text-dark-text dark:text-light-text focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    />
                    <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center space-x-2 py-2 px-4">
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Add Repository</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRepos.map(repo => (
                    <RepoCard
                        key={repo.id}
                        repo={repo}
                        onToggleAutoReview={handleToggleAutoReview}
                        onViewPulse={() => {
                            localStorage.setItem('sentinel-gitops-preload', JSON.stringify({ repoUrl: `https://github.com/${repo.full_name}` }));
                            setActiveView('gitops');
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
