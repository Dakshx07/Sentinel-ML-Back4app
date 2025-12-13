import React, { useState, useEffect, useMemo } from 'react';
import { Repository } from '../types';
import { XIcon, GithubIcon, SpinnerIcon, CheckIcon, SearchIcon, PlusIcon } from './icons';
import { getUserRepos } from '../services/githubService';
import LanguageDot from './LanguageDot';
import { useToast } from './ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-[#050505] border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                <GithubIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-heading tracking-tight">Import Repositories</h2>
                <p className="text-xs text-gray-400 font-mono">SELECT FROM GITHUB</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 pb-2 relative z-10">
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                placeholder="Search your repositories..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-grow overflow-y-auto px-6 py-4 custom-scrollbar relative z-10">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <SpinnerIcon className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-gray-500 text-xs font-mono animate-pulse">FETCHING REPOSITORIES...</p>
              </div>
            )}

            {error && (
              <div className="p-6 text-center border border-red-500/20 bg-red-500/5 rounded-2xl">
                <p className="text-red-400 font-mono text-sm">{error}</p>
              </div>
            )}

            {!isLoading && !error && (
              <ul className="space-y-2">
                {filteredRepos.map(repo => {
                  const isSelected = selectedRepos.some(r => r.id === repo.id);
                  const isAlreadyAdded = existingRepoIds.includes(repo.id);
                  return (
                    <motion.li
                      key={repo.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group"
                    >
                      <button
                        onClick={() => !isAlreadyAdded && handleToggleRepo(repo)}
                        disabled={isAlreadyAdded}
                        className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all border ${isAlreadyAdded
                            ? 'bg-white/[0.02] border-transparent opacity-50 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                              : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/10'
                          }`}
                      >
                        <div className="flex items-center space-x-4 overflow-hidden">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${repo.private ? 'bg-violet-500' : 'bg-emerald-500'}`} />
                          <div className="overflow-hidden">
                            <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                              {repo.full_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{repo.description || 'No description'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 flex-shrink-0">
                          <div className="flex items-center space-x-2 text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
                            <LanguageDot language={repo.language} />
                            <span>{repo.language || 'Unknown'}</span>
                          </div>

                          {isAlreadyAdded ? (
                            <span className="text-xs font-bold text-emerald-500 flex items-center">
                              <CheckIcon className="w-3 h-3 mr-1" /> ADDED
                            </span>
                          ) : (
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected
                                ? 'bg-blue-500 border-blue-500 scale-110'
                                : 'border-white/20 group-hover:border-white/40'
                              }`}>
                              {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                            </div>
                          )}
                        </div>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            )}

            {!isLoading && !error && filteredRepos.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="font-mono text-sm">NO REPOSITORIES FOUND</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 flex justify-end space-x-4 bg-[#050505]/50 backdrop-blur-xl relative z-10">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              CANCEL
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedRepos.length === 0}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center space-x-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:scale-105 active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              <span>IMPORT {selectedRepos.length > 0 ? `(${selectedRepos.length})` : ''}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddRepoModal;
