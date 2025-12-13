import React, { useState, useRef } from 'react';
import { SampleRepo, InputMode, CodeFile } from '../types';
import { CodeIcon, RepoIcon, UploadIcon, SpinnerIcon, CheckIcon, DocumentTextIcon } from './icons';
import { SAMPLE_REPOS } from '../constants';
import { motion } from 'framer-motion';

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
          <div className="p-5 flex flex-col h-full space-y-4">
            <h3 className="text-sm font-bold text-white font-heading uppercase tracking-wider">Paste or Upload Code</h3>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative border border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group ${isDragging
                ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                : 'border-white/20 hover:border-blue-500/50 hover:bg-white/5'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${isDragging ? 'bg-blue-500/20' : 'bg-white/5 group-hover:bg-blue-500/10'}`}>
                <UploadIcon className={`w-6 h-6 transition-colors ${isDragging ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'}`} />
              </div>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                Drag & drop a file or <span className="font-bold text-blue-400">click to upload</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
            </motion.div>

            <div className="flex-grow flex flex-col relative">
              <textarea
                className="w-full h-full flex-grow bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none custom-scrollbar placeholder-gray-600"
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                placeholder="// Paste your code here..."
              />
              <div className="absolute bottom-3 right-3">
                {isAutoAnalyzing ? (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg">
                    <SpinnerIcon className="w-3 h-3 text-blue-400 animate-spin" />
                    <span className="text-[10px] text-gray-400">Typing...</span>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg">
                    <SpinnerIcon className="w-3 h-3 text-purple-400 animate-spin" />
                    <span className="text-[10px] text-gray-400">Analyzing...</span>
                  </div>
                ) : snippet ? (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg border border-emerald-500/20 shadow-lg">
                    <CheckIcon className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-medium">Ready</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      case InputMode.SampleRepo:
        return (
          <div className="p-6 flex flex-col h-full space-y-8">
            <div>
              <h3 className="text-sm font-bold text-white font-heading uppercase tracking-wider mb-4">Select Sample Repo</h3>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                {SAMPLE_REPOS.map(repo => (
                  <motion.div
                    key={repo.id}
                    onClick={() => handleRepoSelect(repo)}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 border rounded-xl cursor-pointer transition-all group ${selectedRepo?.id === repo.id
                      ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={`font-bold text-sm ${selectedRepo?.id === repo.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{repo.name}</p>
                      {selectedRepo?.id === repo.id && <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(59,130,246,0.8)]" />}
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 line-clamp-2 leading-relaxed">{repo.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {selectedRepo && (
              <div className="flex-grow flex flex-col pt-6 border-t border-white/10">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Files</span>
                </h4>
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {selectedRepo.files.map(file => (
                    <motion.button
                      key={file.name}
                      onClick={() => setActiveFile(file)}
                      whileHover={{ x: 4 }}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all group ${activeFile?.name === file.name
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                        }`}
                    >
                      <CodeIcon className={`w-4 h-4 flex-shrink-0 ${activeFile?.name === file.name ? 'text-purple-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                      <span className="text-sm font-mono truncate">{file.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const TabButton = ({ mode, icon, label }: { mode: InputMode, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setInputMode(mode)}
      className={`flex-1 flex items-center justify-center py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all relative overflow-hidden group ${inputMode === mode
        ? 'text-white border-blue-500 bg-white/5'
        : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/[0.02]'
        }`}
    >
      <span className={`relative z-10 flex items-center space-x-2 ${inputMode === mode ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}`}>
        <span className={inputMode === mode ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-500'}>{icon}</span>
        <span>{label}</span>
      </span>
      {inputMode === mode && (
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent" />
      )}
    </button>
  );

  return (
    <div className="bg-black/20 backdrop-blur-md border-r border-white/5 grid grid-rows-[auto_1fr] h-full">
      <div className="flex border-b border-white/5">
        <TabButton mode={InputMode.Snippet} icon={<CodeIcon className="w-4 h-4" />} label="Snippet" />
        <TabButton mode={InputMode.SampleRepo} icon={<RepoIcon className="w-4 h-4" />} label="Samples" />
      </div>
      <div className="overflow-hidden h-full p-2">
        {renderContent()}
      </div>
    </div>
  );
};

export default LeftPanel;