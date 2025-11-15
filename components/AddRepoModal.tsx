import React, { useState, useEffect, useMemo } from 'react';
import { Repository } from '../types';
import { XIcon, GithubIcon, SpinnerIcon, CheckIcon } from './icons';
import { getUserRepos } from '../services/githubService';
import LanguageDot from './LanguageDot';
import { useToast } from './ToastContext';

interface AddRepoModalProps {
  onClose: () => void;
  onAddRepos: (repos: Repository[]) => void;
  existingRepoIds: number[];
}

const AddRepoModal: React.FC<AddRepoModalProps> = ({ onClose, onAddRepos, existingRepoIds }) => {
  const [allRepos, setAllRepos] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const userRepos = await getUserRepos();
        setAllRepos(userRepos);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch repositories.');
        addToast(e.message || 'Failed to fetch repositories.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRepos();
  }, [addToast]);

  const handleToggleRepo = (repo: Repository) => {
    setSelectedRepos(prev => 
      prev.some(r => r.id === repo.id) 
        ? prev.filter(r => r.id !== repo.id) 
        : [...prev, repo]
    );
  };
  
  const handleAddSelected = () => {
    onAddRepos(selectedRepos);
    onClose();
  };

  const filteredRepos = useMemo(() => {
    return allRepos.filter(repo => 
      repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allRepos, searchTerm]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-xl font-bold text-dark-text dark:text-white font-heading">Add Repositories from GitHub</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10">
            <XIcon className="w-6 h-6 text-medium-dark-text dark:text-medium-text" />
          </button>
        </div>

        <div className="p-4">
          <input
            type="text"
            placeholder="Search your repositories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </div>

        <div className="flex-grow overflow-y-auto px-4">
          {isLoading && <div className="flex justify-center items-center p-8"><SpinnerIcon className="w-8 h-8" /></div>}
          {error && <div className="p-4 text-red-500 text-center">{error}</div>}
          {!isLoading && !error && (
            <ul className="space-y-2">
              {filteredRepos.map(repo => {
                const isSelected = selectedRepos.some(r => r.id === repo.id);
                const isAlreadyAdded = existingRepoIds.includes(repo.id);
                return (
                  <li key={repo.id}>
                    <button
                      onClick={() => !isAlreadyAdded && handleToggleRepo(repo)}
                      disabled={isAlreadyAdded}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        isAlreadyAdded ? 'bg-gray-200 dark:bg-white/10 opacity-60 cursor-not-allowed' :
                        isSelected ? 'bg-brand-purple/20' : 'hover:bg-gray-200/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <GithubIcon className="w-5 h-5 text-medium-dark-text dark:text-medium-text flex-shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-semibold text-dark-text dark:text-white truncate">{repo.full_name}</p>
                          <p className="text-xs text-medium-dark-text dark:text-medium-text truncate">{repo.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 flex-shrink-0">
                        <div className="flex items-center space-x-1.5 text-xs text-medium-dark-text dark:text-medium-text">
                           <LanguageDot language={repo.language} />
                           <span>{repo.language}</span>
                        </div>
                        {isAlreadyAdded ? (
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">Added</span>
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-brand-purple border-brand-purple' : 'border-gray-300 dark:border-white/20'}`}>
                            {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary py-2 px-4">Cancel</button>
          <button 
            onClick={handleAddSelected} 
            disabled={selectedRepos.length === 0}
            className="btn-primary py-2 px-4 disabled:opacity-50"
          >
            Add {selectedRepos.length > 0 ? `${selectedRepos.length} Repositor${selectedRepos.length > 1 ? 'ies' : 'y'}` : 'Repositories'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRepoModal;
