import React, { useState, useEffect } from 'react';
import { DEFAULT_SYSTEM_INSTRUCTION, MAX_OUTPUT_TOKENS_LOCAL_STORAGE_KEY } from '../services/geminiService';
import { getAuthenticatedUserProfile } from '../services/githubService';
import { User } from '../types';
import { GithubIcon } from './icons';
import { useToast } from './ToastContext';

const API_KEY_LOCAL_STORAGE_KEY = 'sentinel-api-key';
const SYSTEM_INSTRUCTION_LOCAL_STORAGE_KEY = 'sentinel-system-instruction';
const GITHUB_PAT_LOCAL_STORAGE_KEY = 'sentinel-github-pat';


type SaveState = 'idle' | 'saving' | 'saved';

interface SettingsPageProps {
    user: User | null;
    onProfileUpdate: (updatedUser: Partial<User>) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onProfileUpdate }) => {
    const { addToast } = useToast();
    const [instruction, setInstruction] = useState('');
    const [instructionSaveState, setInstructionSaveState] = useState<SaveState>('idle');
    const [apiKey, setApiKey] = useState('');
    const [apiKeySaveState, setApiKeySaveState] = useState<SaveState>('idle');
    const [username, setUsername] = useState(user?.username || '');
    const [usernameSaveState, setUsernameSaveState] = useState<SaveState>('idle');
    const [githubPat, setGithubPat] = useState('');
    const [githubPatSaveState, setGithubPatSaveState] = useState<SaveState>('idle');
    const [maxOutputTokens, setMaxOutputTokens] = useState('');
    const [maxOutputTokensSaveState, setMaxOutputTokensSaveState] = useState<SaveState>('idle');

    useEffect(() => {
        setInstruction(localStorage.getItem(SYSTEM_INSTRUCTION_LOCAL_STORAGE_KEY) || DEFAULT_SYSTEM_INSTRUCTION);
        setApiKey(localStorage.getItem(API_KEY_LOCAL_STORAGE_KEY) || '');
        setGithubPat(localStorage.getItem(GITHUB_PAT_LOCAL_STORAGE_KEY) || '');
        setMaxOutputTokens(localStorage.getItem(MAX_OUTPUT_TOKENS_LOCAL_STORAGE_KEY) || '');
        if (user) {
            setUsername(user.username);
        }
    }, [user]);

    const createSaveEffect = (saveState: SaveState, setSaveState: React.Dispatch<React.SetStateAction<SaveState>>) => {
        if (saveState === 'saved') {
            const timer = setTimeout(() => setSaveState('idle'), 2000);
            return () => clearTimeout(timer);
        }
    };

    useEffect(() => createSaveEffect(instructionSaveState, setInstructionSaveState), [instructionSaveState]);
    useEffect(() => createSaveEffect(apiKeySaveState, setApiKeySaveState), [apiKeySaveState]);
    useEffect(() => createSaveEffect(usernameSaveState, setUsernameSaveState), [usernameSaveState]);
    useEffect(() => createSaveEffect(githubPatSaveState, setGithubPatSaveState), [githubPatSaveState]);
    useEffect(() => createSaveEffect(maxOutputTokensSaveState, setMaxOutputTokensSaveState), [maxOutputTokensSaveState]);


    const handleSave = (
        value: string,
        key: string,
        setSaveState: React.Dispatch<React.SetStateAction<SaveState>>,
        callback?: (value: any) => void
    ) => {
        setSaveState('saving');
        if (callback) {
            callback(value);
        } else {
            localStorage.setItem(key, value);
        }
        setTimeout(() => setSaveState('saved'), 500);
    };

    const handleSaveGitHubPat = async () => {
        if (!githubPat.trim()) {
            addToast("Please enter a GitHub Personal Access Token.");
            return;
        }
        setGithubPatSaveState('saving');
        localStorage.setItem(GITHUB_PAT_LOCAL_STORAGE_KEY, githubPat);
        try {
            const profile = await getAuthenticatedUserProfile();
            onProfileUpdate({ github: profile, username: profile.name || profile.login });
            setGithubPatSaveState('saved');
            addToast(`Successfully connected to GitHub as @${profile.login}!`, 'success');
        } catch (error: any) {
            addToast(error.message || 'Failed to verify GitHub token.');
            if (error.status === 401) {
                localStorage.removeItem(GITHUB_PAT_LOCAL_STORAGE_KEY);
                onProfileUpdate({ github: undefined });
            }
            setGithubPatSaveState('idle');
        }
    };

    const SaveButton: React.FC<{ state: SaveState, label: string, onSave: () => void, className?: string }> = ({ state, label, onSave, className }) => (
        <button onClick={onSave} disabled={state !== 'idle'} className={`btn-primary text-center transition-all ${className}`}>
            {state === 'idle' && label}
            {state === 'saving' && 'Saving...'}
            {state === 'saved' && 'Saved!'}
        </button>
    );

    return (
        <div className="h-full w-full">
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg border border-gray-200 dark:border-white/10 p-6 md:p-8 max-w-4xl mx-auto space-y-12">

                {user && (
                    <div>
                        <h2 className="text-3xl font-bold text-dark-text dark:text-white font-heading mb-4">Profile Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-medium-dark-text dark:text-medium-text mb-2">Username</label>
                                <input id="username" type="text"
                                    className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-3 text-sm text-dark-text dark:text-light-text focus:outline-none focus:ring-2 focus:ring-brand-purple"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setUsernameSaveState('idle'); }}
                                />
                            </div>
                            <div className="flex items-center justify-end">
                                <SaveButton state={usernameSaveState} label="Save Username" onSave={() => handleSave(username, '', setUsernameSaveState, () => onProfileUpdate({ username }))} className="w-36" />
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-3xl font-bold text-dark-text dark:text-white font-heading mb-4">Integrations</h2>
                    <div className="glass-effect p-6 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                                <GithubIcon className="w-8 h-8 text-dark-text dark:text-white" />
                                <div>
                                    <h3 className="font-bold text-lg text-dark-text dark:text-light-text">GitHub</h3>
                                    <p className="text-sm text-medium-dark-text dark:text-medium-text">
                                        {user?.github ? `Connected as @${user.github.login}` : 'Not Connected'}
                                    </p>
                                </div>
                            </div>
                            {user?.github ? (
                                <span className="text-sm font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full">Connected</span>
                            ) : (
                                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-3 py-1 rounded-full">Not Connected</span>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/20">
                            <h4 className="font-semibold text-dark-text dark:text-light-text">GitHub Personal Access Token (Required)</h4>
                            <p className="text-sm text-medium-dark-text dark:text-medium-text mt-2">
                                Provide a <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline">Classic personal access token</a> with the full <code className="bg-gray-200 dark:bg-black/30 px-1.5 py-0.5 rounded-md font-mono text-xs">'repo'</code> and <code className="bg-gray-200 dark:bg-black/30 px-1.5 py-0.5 rounded-md font-mono text-xs">'security_events'</code> scopes. Fine-grained tokens are not recommended.
                            </p>
                            <div className="mt-4">
                                <input type="password"
                                    className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-3 font-mono text-sm text-dark-text dark:text-light-text focus:outline-none focus:ring-2 focus:ring-brand-purple"
                                    value={githubPat}
                                    onChange={(e) => { setGithubPat(e.target.value); setGithubPatSaveState('idle'); }}
                                    placeholder="ghp_..."
                                />
                            </div>
                            <div className="mt-4 flex items-center justify-end">
                                <SaveButton state={githubPatSaveState} label={user?.github ? "Update Token" : "Save & Connect"} onSave={handleSaveGitHubPat} className="w-40" />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-3xl font-bold text-dark-text dark:text-white font-heading mb-4">Gemini API Key</h2>
                    <p className="text-medium-dark-text dark:text-medium-text mb-4">
                        Your key is stored in your browser's local storage and is never sent to our servers.
                    </p>
                    <label htmlFor="api-key" className="block text-sm font-medium text-medium-dark-text dark:text-medium-text mb-2">Your Gemini API Key</label>
                    <input id="api-key" type="password"
                        className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-3 font-mono text-sm text-dark-text dark:text-light-text focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        value={apiKey}
                        onChange={(e) => { setApiKey(e.target.value); setApiKeySaveState('idle'); }}
                        placeholder="Enter your Gemini API key here"
                    />
                    <div className="mt-4 flex items-center justify-end">
                        <SaveButton state={apiKeySaveState} label="Save Key" onSave={() => handleSave(apiKey, API_KEY_LOCAL_STORAGE_KEY, setApiKeySaveState)} className="w-32" />
                    </div>
                </div>

                <div>
                    <h2 className="text-3xl font-bold text-dark-text dark:text-white font-heading mb-4">AI Agent Configuration</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="system-instruction" className="block text-sm font-medium text-medium-dark-text dark:text-medium-text mb-2">System Instruction</label>
                            <p className="text-xs text-medium-dark-text dark:text-medium-text mb-3"> Customize the core behavior of the Sentinel AI agent. </p>
                            <textarea id="system-instruction" rows={8}
                                className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-3 font-mono text-sm text-dark-text dark:text-light-text focus:outline-none focus:ring-2 focus:ring-brand-purple"
                                value={instruction}
                                onChange={(e) => { setInstruction(e.target.value); setInstructionSaveState('idle'); }}
                            />
                            <div className="mt-4 flex flex-wrap items-center justify-end gap-4">
                                <button onClick={() => setInstruction(DEFAULT_SYSTEM_INSTRUCTION)} className="bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-dark-text dark:text-white font-semibold py-2 px-4 rounded-md transition-colors">
                                    Reset to Default
                                </button>
                                <SaveButton state={instructionSaveState} label="Save Instruction" onSave={() => handleSave(instruction, SYSTEM_INSTRUCTION_LOCAL_STORAGE_KEY, setInstructionSaveState)} className="w-36" />
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-bold text-dark-text dark:text-white font-heading mb-2">Model Parameters</h3>
                            <label htmlFor="max-tokens" className="block text-sm font-medium text-medium-dark-text dark:text-medium-text mb-2"> Max Output Tokens </label>
                            <p className="text-xs text-medium-dark-text dark:text-medium-text mb-3"> Limit the AI's response length. Lower values are faster but may be less detailed. Leave blank for no limit. </p>
                            <input id="max-tokens" type="number"
                                className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-white/10 rounded-md p-3 font-mono text-sm text-dark-text dark:text-light-text focus:outline-none focus:ring-2 focus:ring-brand-purple"
                                value={maxOutputTokens}
                                onChange={(e) => { setMaxOutputTokens(e.target.value); setMaxOutputTokensSaveState('idle'); }}
                                placeholder="e.g., 2048"
                                min="0"
                            />
                            <div className="mt-4 flex items-center justify-end">
                                <SaveButton state={maxOutputTokensSaveState} label="Save Tokens" onSave={() => handleSave(maxOutputTokens, MAX_OUTPUT_TOKENS_LOCAL_STORAGE_KEY, setMaxOutputTokensSaveState)} className="w-36" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;