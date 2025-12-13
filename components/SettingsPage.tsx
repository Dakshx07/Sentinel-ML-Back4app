import React, { useState, useEffect } from 'react';
import { DEFAULT_SYSTEM_INSTRUCTION, MAX_OUTPUT_TOKENS_LOCAL_STORAGE_KEY } from '../services/geminiService';
import { getAuthenticatedUserProfile } from '../services/githubService';
import { User } from '../types';
import { GithubIcon, CheckCircleIcon, SettingsIcon, KeyIcon, CpuChipIcon, UserIcon } from './icons';
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
const SettingsSection: React.FC<{ title: string; description?: string; icon: React.ReactNode; children: React.ReactNode; delay?: number }> =
    ({ title, description, icon, children, delay = 0 }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="bg-[#050505]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-500" />

            <div className="flex items-start space-x-4 mb-8 relative z-10">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white font-heading tracking-tight">{title}</h2>
                    {description && <p className="text-sm text-gray-400 mt-1 font-light">{description}</p>}
                </div>
            </div>
            <div className="relative z-10">
                {children}
            </div>
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
        <label htmlFor={id} className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
        <input
            id={id}
            type={type}
            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
        {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
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
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${state === 'saved'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10'
                : state === 'saving'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-blue-500/10'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 hover:shadow-blue-500/40'
                }`}
        >
            {state === 'idle' && label}
            {state === 'saving' && 'SAVING...'}
            {state === 'saved' && (
                <span className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>SAVED</span>
                </span>
            )}
        </motion.button>
    );

    return (
        <div className="h-full w-full p-2 space-y-8 animate-fade-in-up">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-end justify-between"
            >
                <div>
                    <h1 className="text-4xl font-black text-white font-heading tracking-tighter">SYSTEM CONFIGURATION</h1>
                    <p className="text-gray-400 text-sm mt-2 font-mono flex items-center">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                        CONTROL PANEL • v2.0.0
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
                {/* Profile */}
                {user && (
                    <SettingsSection
                        title="User Profile"
                        description="Manage your identity and display preferences"
                        icon={<UserIcon className="w-6 h-6 text-blue-400" />}
                        delay={0.1}
                    >
                        <div className="space-y-6">
                            <SettingsInput id="username" label="Display Name" value={username} onChange={(v) => { setUsername(v); setUsernameSaveState('idle'); }} />
                            <div className="flex justify-end">
                                <SaveButton state={usernameSaveState} label="UPDATE PROFILE" onSave={() => handleSave(username, '', setUsernameSaveState, () => onProfileUpdate({ username }))} />
                            </div>
                        </div>
                    </SettingsSection>
                )}

                {/* GitHub Integration */}
                <SettingsSection
                    title="GitHub Connection"
                    description="Link your GitHub account for repository access"
                    icon={<GithubIcon className="w-6 h-6 text-white" />}
                    delay={0.2}
                >
                    <div className="flex items-center justify-between mb-8 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-white/5 rounded-xl">
                                <GithubIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">GitHub Status</h3>
                                <p className="text-xs text-gray-500 font-mono mt-1">
                                    {user?.github ? `@${user.github.login}` : 'DISCONNECTED'}
                                </p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border ${user?.github
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                            {user?.github ? 'Connected' : 'Offline'}
                        </span>
                    </div>
                    <div className="space-y-6">
                        <SettingsInput
                            id="github-pat"
                            label="Personal Access Token"
                            type="password"
                            value={githubPat}
                            onChange={(v) => { setGithubPat(v); setGithubPatSaveState('idle'); }}
                            placeholder="ghp_..."
                            hint={<>Create a <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">classic token</a> with <code className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white">repo</code> scope</>}
                        />
                        <div className="flex justify-end">
                            <SaveButton state={githubPatSaveState} label={user?.github ? "UPDATE TOKEN" : "CONNECT ACCOUNT"} onSave={handleSaveGitHubPat} />
                        </div>
                    </div>
                </SettingsSection>

                {/* Gemini API */}
                <SettingsSection
                    title="AI Core Access"
                    description="Configure your Gemini API key for intelligence features"
                    icon={<KeyIcon className="w-6 h-6 text-amber-400" />}
                    delay={0.3}
                >
                    <div className="space-y-6">
                        <SettingsInput
                            id="api-key"
                            label="Gemini API Key"
                            type="password"
                            value={apiKey}
                            onChange={(v) => { setApiKey(v); setApiKeySaveState('idle'); }}
                            placeholder="Enter your Gemini API key"
                            hint="Your key is encrypted and stored locally."
                        />
                        <div className="flex justify-end">
                            <SaveButton state={apiKeySaveState} label="SAVE KEY" onSave={() => handleSave(apiKey, API_KEY_LOCAL_STORAGE_KEY, setApiKeySaveState)} />
                        </div>
                    </div>
                </SettingsSection>

                {/* AI Configuration */}
                <SettingsSection
                    title="Neural Configuration"
                    description="Fine-tune the AI agent's behavior and parameters"
                    icon={<CpuChipIcon className="w-6 h-6 text-purple-400" />}
                    delay={0.4}
                >
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">System Instruction</label>
                            <textarea
                                rows={6}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono resize-none"
                                value={instruction}
                                onChange={(e) => { setInstruction(e.target.value); setInstructionSaveState('idle'); }}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setInstruction(DEFAULT_SYSTEM_INSTRUCTION)}
                                    className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors uppercase tracking-wider"
                                >
                                    Reset Default
                                </button>
                                <SaveButton state={instructionSaveState} label="SAVE CONFIG" onSave={() => handleSave(instruction, SYSTEM_INSTRUCTION_LOCAL_STORAGE_KEY, setInstructionSaveState)} />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <SettingsInput
                                id="max-tokens"
                                label="Max Output Tokens"
                                type="number"
                                value={maxOutputTokens}
                                onChange={(v) => { setMaxOutputTokens(v); setMaxOutputTokensSaveState('idle'); }}
                                placeholder="e.g., 2048"
                                hint="Limit AI response length. Leave blank for no limit."
                            />
                            <div className="flex justify-end mt-6">
                                <SaveButton state={maxOutputTokensSaveState} label="SAVE LIMITS" onSave={() => handleSave(maxOutputTokens, MAX_OUTPUT_TOKENS_LOCAL_STORAGE_KEY, setMaxOutputTokensSaveState)} />
                            </div>
                        </div>
                    </div>
                </SettingsSection>
            </div>
        </div>
    );
};

export default SettingsPage;