import React from 'react';
import { Repository } from '../types';
import { StarIcon, EyeIcon, ErrorIcon, TrendingUpIcon, RepoIcon } from './icons';
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
      whileHover={{ y: -2 }}
      className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 group"
    >
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3 overflow-hidden min-w-0">
            <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
              <RepoIcon className="w-4 h-4 text-blue-400" />
            </div>
            <a
              href={`https://github.com/${repo.full_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-white hover:text-blue-400 truncate transition-colors"
              title={repo.full_name}
            >
              {repo.full_name}
            </a>
          </div>
          <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${repo.private
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
            {repo.private ? 'Private' : 'Public'}
          </span>
        </div>
        <p className="mt-3 text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {repo.description || 'No description available.'}
        </p>
      </div>

      {/* Stats & Actions */}
      <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
        {/* Meta Info */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1.5" title={repo.language || 'Unknown'}>
            <LanguageDot language={repo.language} />
            <span>{repo.language || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-1" title={`${repo.stargazers_count} stars`}>
            <StarIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>{repo.stargazers_count}</span>
          </div>
          <div className="flex items-center space-x-1" title={`${repo.watchers_count} watchers`}>
            <EyeIcon className="w-3.5 h-3.5 text-gray-400" />
            <span>{repo.watchers_count}</span>
          </div>
          {repo.open_issues_count > 0 && (
            <div className="flex items-center space-x-1" title={`${repo.open_issues_count} issues`}>
              <ErrorIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>{repo.open_issues_count}</span>
            </div>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between">
          {/* View Pulse Button */}
          <button
            onClick={() => onViewPulse(repo.full_name)}
            className="flex items-center space-x-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            <TrendingUpIcon className="w-3.5 h-3.5" />
            <span>View Pulse</span>
          </button>

          {/* Auto Review Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Auto Review</span>
            <ToggleSwitch enabled={repo.autoReview} setEnabled={(enabled) => onToggleAutoReview(repo.id, enabled)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RepoCard;