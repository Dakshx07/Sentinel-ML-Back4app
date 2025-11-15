import React from 'react';
import { Repository } from '../types';
import { StarIcon, EyeIcon, ErrorIcon, TrendingUpIcon, RepoIcon } from './icons';
import LanguageDot from './LanguageDot';
import ToggleSwitch from './ToggleSwitch';

interface RepoCardProps {
  repo: Repository;
  onToggleAutoReview: (repoId: number, enabled: boolean) => void;
  onViewPulse: (repoFullName: string) => void;
}

const RepoCard: React.FC<RepoCardProps> = ({ repo, onToggleAutoReview, onViewPulse }) => {
  return (
    <div className="bg-light-secondary dark:bg-dark-secondary border border-gray-200 dark:border-white/10 rounded-lg p-5 flex flex-col justify-between transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-brand-purple/50">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <RepoIcon className="w-5 h-5 text-medium-dark-text dark:text-medium-text flex-shrink-0" />
            <a href={`https://github.com/${repo.full_name}`} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-dark-text dark:text-white hover:text-brand-purple dark:hover:text-brand-cyan truncate" title={repo.full_name}>
              {repo.full_name}
            </a>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${repo.private ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30' : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-white/10 dark:text-medium-text dark:border-white/20'}`}>
            {repo.private ? 'Private' : 'Public'}
          </span>
        </div>
        <p className="mt-2 text-sm text-medium-dark-text dark:text-medium-text h-10 overflow-hidden">
          {repo.description || 'No description available.'}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-medium-dark-text dark:text-medium-text">
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                <div className="flex items-center space-x-1.5" title={`${repo.language}`}>
                    <LanguageDot language={repo.language} />
                    <span>{repo.language || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1" title={`${repo.stargazers_count} stars`}>
                    <StarIcon className="w-4 h-4 text-yellow-500" />
                    <span>{repo.stargazers_count}</span>
                </div>
                <div className="flex items-center space-x-1" title={`${repo.watchers_count} watchers`}>
                    <EyeIcon className="w-4 h-4" />
                    <span>{repo.watchers_count}</span>
                </div>
                <div className="flex items-center space-x-1" title={`${repo.open_issues_count} open issues`}>
                    <ErrorIcon className="w-4 h-4 text-orange-500" />
                    <span>{repo.open_issues_count}</span>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-xs font-medium">Auto Review</span>
                <ToggleSwitch enabled={repo.autoReview} setEnabled={(enabled) => onToggleAutoReview(repo.id, enabled)} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default RepoCard;