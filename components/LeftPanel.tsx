import React, { useState, useRef } from 'react';
import { SampleRepo, InputMode, CodeFile } from '../types';
import { CodeIcon, RepoIcon, UploadIcon, SpinnerIcon, CheckIcon } from './icons';
import { SAMPLE_REPOS } from '../constants';

interface LeftPanelProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  selectedRepo: SampleRepo | null;
  setSelectedRepo: (repo: SampleRepo) => void;
  activeFile: CodeFile | null;
  setActiveFile: (file: CodeFile) => void;
  snippet: string;
  setSnippet: (code: string) => void;
  isLoading: boolean;
  onFileChange: (file: { name: string, content: string }) => void;
  isAutoAnalyzing: boolean;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  inputMode,
  setInputMode,
  selectedRepo,
  setSelectedRepo,
  activeFile,
  setActiveFile,
  snippet,
  setSnippet,
  isLoading,
  onFileChange,
  isAutoAnalyzing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileChange({ name: file.name, content });
    };
    reader.onerror = () => {
      console.error("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRepoSelect = (repo: SampleRepo) => {
    setSelectedRepo(repo);
    // When a new repo is selected, also select its first file.
    if (repo.files && repo.files.length > 0) {
      setActiveFile(repo.files[0]);
    }
  };


  const renderContent = () => {
    switch (inputMode) {
      case InputMode.Snippet:
        return (
          <div className="p-4 flex flex-col h-full">
            <h3 className="text-lg font-bold text-dark-text dark:text-light-text font-heading mb-2">Paste or Upload Code</h3>

            <div
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer mb-4 ${isDragging ? 'border-brand-purple bg-brand-purple/10' : 'border-gray-300 dark:border-white/20 hover:border-brand-cyan'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="w-8 h-8 mx-auto text-medium-dark-text dark:text-medium-text" />
              <p className="mt-2 text-sm text-medium-dark-text dark:text-medium-text">
                Drag & drop a file or <span className="font-semibold text-brand-purple">click to upload</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <textarea
              className="w-full flex-grow bg-light-secondary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-2 font-mono text-sm text-dark-text dark:text-light-text focus:outline-none focus:ring-2 focus:ring-brand-purple"
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              placeholder="Paste your code here..."
            />
            <div className="mt-4 h-10 flex items-center justify-center text-center px-4">
              {isAutoAnalyzing ? (
                <div className="flex items-center space-x-2 text-sm text-medium-dark-text dark:text-medium-text">
                  <SpinnerIcon className="w-4 h-4" />
                  <span>Waiting for you to finish typing...</span>
                </div>
              ) : isLoading ? (
                <div className="flex items-center space-x-2 text-sm text-medium-dark-text dark:text-medium-text">
                  <SpinnerIcon className="w-4 h-4" />
                  <span>Analyzing code...</span>
                </div>
              ) : snippet ? (
                <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <CheckIcon className="w-4 h-4" />
                  <span>Analysis is up to date</span>
                </div>
              ) : (
                <p className="text-sm text-medium-dark-text dark:text-medium-text">Paste or upload code to begin analysis.</p>
              )}
            </div>
          </div>
        );
      case InputMode.SampleRepo:
        return (
          <div className="p-4 flex flex-col h-full">
            <h3 className="text-lg font-bold text-dark-text dark:text-light-text font-heading mb-2">Select Sample Repo</h3>
            <div className="space-y-2 flex-grow overflow-y-auto pr-1">
              {SAMPLE_REPOS.map(repo => (
                <div key={repo.id} onClick={() => handleRepoSelect(repo)}
                  className={`p-3 border rounded-md cursor-pointer transition-all ${selectedRepo?.id === repo.id ? 'bg-brand-purple/20 border-brand-purple' : 'bg-light-secondary dark:bg-dark-primary border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'}`}>
                  <p className="font-bold text-dark-text dark:text-white">{repo.name}</p>
                  <p className="text-sm text-medium-dark-text dark:text-medium-text">{repo.description}</p>
                </div>
              ))}
            </div>
            {selectedRepo && (
              <div className="mt-4 border-t border-gray-200 dark:border-white/10 pt-4">
                <h4 className="text-md font-bold text-dark-text dark:text-light-text font-heading mb-2">Files</h4>
                <ul className="space-y-1">
                  {selectedRepo.files.map(file => (
                    <li key={file.name} onClick={() => setActiveFile(file)} className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${activeFile?.name === file.name ? 'bg-brand-purple/20' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                      <CodeIcon className="w-4 h-4 text-medium-dark-text dark:text-medium-text" />
                      <span className="text-sm text-dark-text dark:text-white">{file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
    }
  };

  const TabButton = ({ mode, icon, label }: { mode: InputMode, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setInputMode(mode)}
      className={`flex-1 flex items-center justify-center p-3 text-sm font-medium border-b-2 transition-colors ${inputMode === mode ? 'text-brand-purple border-brand-cyan' : 'text-medium-dark-text dark:text-medium-text border-transparent hover:bg-gray-100 dark:hover:bg-white/5'}`}
    >
      <span className={inputMode === mode ? 'text-brand-cyan' : ''}>{icon}</span>
      <span className={`ml-2 ${inputMode === mode ? 'gradient-text' : ''}`}>{label}</span>
    </button>
  );

  return (
    <div className="bg-light-secondary dark:bg-dark-secondary border-r border-gray-200 dark:border-white/10 grid grid-rows-[auto_1fr] h-full">
      <div className="flex border-b border-gray-200 dark:border-white/10">
        <TabButton mode={InputMode.Snippet} icon={<CodeIcon className="w-5 h-5" />} label="Snippet" />
        <TabButton mode={InputMode.SampleRepo} icon={<RepoIcon className="w-5 h-5" />} label="Samples" />
      </div>
      <div className="overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default LeftPanel;