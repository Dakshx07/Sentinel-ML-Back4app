import React, { useState, useEffect } from 'react';
import { DEFAULT_SYSTEM_INSTRUCTION, MAX_OUTPUT_TOKENS_LOCAL_STORAGE_KEY } from '../services/geminiService';
import { getAuthenticatedUserProfile } from '../services/githubService';
import { User } from '../types';
import { GithubIcon, CheckCircleIcon } from './icons';
import { useToast } from './ToastContext';
import { motion } from 'framer-motion';

const API_KEY_LOCAL_STORAGE_KEY = 'sentinel-api-key';
const SYSTEM_INSTRUCTION_LOCAL_STORAGE_KEY = 'sentinel-system-instruction';
const GITHUB_PAT_LOCAL_STORAGE_KEY = 'sentinel-github-pat';

type SaveState = 'idle' | 'saving' | 'saved';

interface SettingsPageProps {
    user: User | null;
    onProfileUpdate: (updatedUser: Partial<User>) => void;
}

// Section wrapper component
const SettingsSection: React.FC<{ title: string; description?: string; children: React.ReactNode; delay?: number }> =
    ({ title, description, children, delay = 0 }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="bg-[#0A0A0A] rounded-2xl border border-white/5 p-6"
        >
            <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
            {description && <p className="text-sm text-gray-500 mb-5">{description}</p>}
            {!description && <div className="mb-5" />}
            {children}
        </motion.div>
    );

// Input component
const SettingsInput: React.FC<{
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    hint?: React.ReactNode;
}> = ({ id, label, type = 'text', value, onChange, placeholder, hint }) => (
    <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-400">{label}</label>
        {hint && <p className="text-xs text-gray-600">{hint}</p>}
        <input
            id={id}
            type={type}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

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
        if (user) setUsername(user.username);
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

    const handleSave = (value: string, key: string, setSaveState: React.Dispatch<React.SetStateAction<SaveState>>, callback?: (value: any) => void) => {
        setSaveState('saving');
        if (callback) callback(value);
        else localStorage.setItem(key, value);
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

    const SaveButton: React.FC<{ state: SaveState; label: string; onSave: () => void }> = ({ state, label, onSave }) => (
        <motion.button
            onClick={onSave}
            disabled={state !== 'idle'}
            whileHover={{ scale: state === 'idle' ? 1.02 : 1 }}
            whileTap={{ scale: state === 'idle' ? 0.98 : 1 }}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${state === 'saved'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : state === 'saving'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:shadow-lg hover:shadow-blue-500/20'
                }`}
        >
            {state === 'idle' && label}
            {state === 'saving' && 'Saving...'}
            {state === 'saved' && (
                <span className="flex items-center space-x-1.5">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>Saved!</span>
                </span>
            )}
        </motion.button>
    );

    return (
        <div className="h-full w-full">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
            >
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Configure your account and integrations</p>
            </motion.div>

            <div className="max-w-3xl space-y-6">
                {/* Profile */}
                {user && (
                    <SettingsSection title="Profile" description="Manage your account details" delay={0.1}>
                        <div className="space-y-4">
                            <SettingsInput id="username" label="Username" value={username} onChange={(v) => { setUsername(v); setUsernameSaveState('idle'); }} />
                            <div className="flex justify-end">
                                <SaveButton state={usernameSaveState} label="Save Username" onSave={() => handleSave(username, '', setUsernameSaveState, () => onProfileUpdate({ username }))} />
                            </div>
                        </div>
                    </SettingsSection>
                )}

                {/* GitHub Integration */}
                <SettingsSection title="GitHub Integration" description="Connect your GitHub account for repository access" delay={0.2}>
                    <div className="flex items-center justify-between mb-6 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/5 rounded-xl">
                                <GithubIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white">GitHub</h3>
                                <p className="text-sm text-gray-500">
                                    {user?.github ? `@${user.github.login}` : 'Not connected'}
                                </p>
                            </div>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${user?.github
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                            {user?.github ? 'Connected' : 'Not Connected'}
                        </span>
                    </div>
                    <div className="space-y-4">
                        <SettingsInput
                            id="github-pat"
                            label="Personal Access Token"
                            type="password"
                            value={githubPat}
                            onChange={(v) => { setGithubPat(v); setGithubPatSaveState('idle'); }}
                            placeholder="ghp_..."
                            hint={<>Create a <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">classic token</a> with <code className="bg-white/5 px-1 py-0.5 rounded text-[10px]">repo</code> scope</>}
                        />
                        <div className="flex justify-end">
                            <SaveButton state={githubPatSaveState} label={user?.github ? "Update Token" : "Connect"} onSave={handleSaveGitHubPat} />
                        </div>
                    </div>
                </SettingsSection>

                {/* Gemini API */}
                <SettingsSection title="Gemini API Key" description="Your key is stored locally and never sent to our servers" delay={0.3}>
                    <div className="space-y-4">
                        <SettingsInput
                            id="api-key"
                            label="API Key"
                            type="password"
                            value={apiKey}
                            onChange={(v) => { setApiKey(v); setApiKeySaveState('idle'); }}
                            placeholder="Enter your Gemini API key"
                        />
                        <div className="flex justify-end">
                            <SaveButton state={apiKeySaveState} label="Save Key" onSave={() => handleSave(apiKey, API_KEY_LOCAL_STORAGE_KEY, setApiKeySaveState)} />
                        </div>
                    </div>
                </SettingsSection>

                {/* AI Configuration */}
                <SettingsSection title="AI Configuration" description="Customize the AI agent behavior" delay={0.4}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-400">System Instruction</label>
                            <textarea
                                rows={6}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono resize-none"
                                value={instruction}
                                onChange={(e) => { setInstruction(e.target.value); setInstructionSaveState('idle'); }}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setInstruction(DEFAULT_SYSTEM_INSTRUCTION)}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    Reset Default
                                </button>
                                <SaveButton state={instructionSaveState} label="Save" onSave={() => handleSave(instruction, SYSTEM_INSTRUCTION_LOCAL_STORAGE_KEY, setInstructionSaveState)} />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <SettingsInput
                                id="max-tokens"
                                label="Max Output Tokens"
                                type="number"
                                value={maxOutputTokens}
                                onChange={(v) => { setMaxOutputTokens(v); setMaxOutputTokensSaveState('idle'); }}
                                placeholder="e.g., 2048"
                                hint="Limit AI response length. Leave blank for no limit."
                            />
                            <div className="flex justify-end mt-4">
                                <SaveButton state={maxOutputTokensSaveState} label="Save" onSave={() => handleSave(maxOutputTokens, MAX_OUTPUT_TOKENS_LOCAL_STORAGE_KEY, setMaxOutputTokensSaveState)} />
                            </div>
                        </div>
                    </div>
                </SettingsSection>
            </div>
        </div>
    );
};

export default SettingsPage;