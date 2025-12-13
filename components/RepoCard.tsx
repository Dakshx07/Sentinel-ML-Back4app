import React from 'react';
import { Repository } from '../types';
import { StarIcon, EyeIcon, ErrorIcon, TrendingUpIcon, RepoIcon, SparklesIcon } from './icons';
import LanguageDot from './LanguageDot';
import ToggleSwitch from './ToggleSwitch';
import { motion } from 'framer-motion';

interface RepoCardProps {
  repo: Repository;
  onToggleAutoReview: (repoId: number, enabled: boolean) => void;
  onViewPulse: (repoFullName: string) => void;
}

const RepoCard: React.FC<RepoCardProps> = ({ repo, onToggleAutoReview, onViewPulse }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] group relative overflow-hidden h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3 overflow-hidden min-w-0">
            <div className="p-2.5 bg-blue-500/10 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20">
              <RepoIcon className="w-5 h-5 text-blue-400" />
            </div>
            <a
              href={`https://github.com/${repo.full_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-bold text-white hover:text-blue-400 truncate transition-colors font-heading tracking-tight"
              title={repo.full_name}
            >
              {repo.full_name}
            </a>
          </div>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex-shrink-0 uppercase tracking-wider border ${repo.private
            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
            {repo.private ? 'Private' : 'Public'}
          </span>
        </div>
        <p className="mt-4 text-sm text-gray-400 line-clamp-2 leading-relaxed font-light">
          {repo.description || 'No description available.'}
        </p>
      </div>

      {/* Stats & Actions */}
      <div className="mt-6 pt-6 border-t border-white/5 space-y-5 relative z-10">
        {/* Meta Info */}
        <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-gray-500">
          <div className="flex items-center space-x-2" title={repo.language || 'Unknown'}>
            <LanguageDot language={repo.language} />
            <span className="text-gray-300">{repo.language || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-1.5" title={`${repo.stargazers_count} stars`}>
            <StarIcon className="w-4 h-4 text-amber-400" />
            <span>{repo.stargazers_count}</span>
          </div>
          <div className="flex items-center space-x-1.5" title={`${repo.watchers_count} watchers`}>
            <EyeIcon className="w-4 h-4 text-blue-400" />
            <span>{repo.watchers_count}</span>
          </div>
          {repo.open_issues_count > 0 && (
            <div className="flex items-center space-x-1.5" title={`${repo.open_issues_count} issues`}>
              <ErrorIcon className="w-4 h-4 text-red-400" />
              <span>{repo.open_issues_count}</span>
            </div>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between">
          {/* View Pulse Button */}
          <button
            onClick={() => onViewPulse(repo.full_name)}
            className="flex items-center space-x-2 text-xs font-bold text-white px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>VIEW PULSE</span>
          </button>

          {/* Auto Review Toggle */}
          <div className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Auto Review</span>
            <ToggleSwitch enabled={repo.autoReview} setEnabled={(enabled) => onToggleAutoReview(repo.id, enabled)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RepoCard;