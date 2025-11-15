import React from 'react';
import { InfoIcon, SettingsIcon } from './icons';
import { DashboardView } from '../types';

interface DemoModeBannerProps {
  onNavigate: (view: DashboardView) => void;
}

const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ onNavigate }) => {
  return (
    <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-md mb-6 flex items-center justify-between shadow-md animate-fade-in">
      <div className="flex items-center">
        <InfoIcon className="w-6 h-6 mr-3 text-yellow-500" />
        <div>
          <p className="font-bold">Demo Mode is Active</p>
          <p className="text-sm">All AI analysis is using mock data. No API quota is being used.</p>
        </div>
      </div>
      <button 
        onClick={() => onNavigate('settings')} 
        className="flex items-center space-x-2 text-sm font-semibold hover:underline text-yellow-800 dark:text-yellow-200"
      >
        <span>Change in Settings</span>
        <SettingsIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default DemoModeBanner;
