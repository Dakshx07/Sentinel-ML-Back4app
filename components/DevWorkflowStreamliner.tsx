import React, { useState, useEffect, useRef } from 'react';
import { Repository, User } from '../types';
import { useToast } from './ToastContext';
import { CpuChipIcon, SpinnerIcon, ErrorIcon, SettingsIcon, VolumeUpIcon, SendIcon, DownloadIcon, UserIcon, RobotIcon, SparklesIcon } from './icons';
import { getRepoFileTree, getFileContent, parseGitHubUrl } from '../services/githubService';
import { queryRepoInsights, isApiKeySet, generateSpeech } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

declare global {
    interface Window {
        jspdf: any;
        html2canvas: any;
    }
}

interface DevWorkflowStreamlinerProps {
    repos: Repository[];
    user: User | null;
    onNavigateToSettings: () => void;
}

interface Message {
    id: number;
    sender: 'user' | 'ai';
    text: string;
}

function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


const DevWorkflowStreamliner: React.FC<DevWorkflowStreamlinerProps> = ({ repos, user, onNavigateToSettings }) => {
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>('');
    const [query, setQuery] = useState('');
    const [conversation, setConversation] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeyMissing, setApiKeyMissing] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const [activeAudio, setActiveAudio] = useState<{ messageId: number; source: AudioBufferSourceNode } | null>(null);
    const [loadingAudioId, setLoadingAudioId] = useState<number | null>(null);

    useEffect(() => {
        if (repos.length > 0 && !selectedRepoFullName) {
            setSelectedRepoFullName(repos[0].full_name);
        }
    }, [repos, selectedRepoFullName]);

    useEffect(() => {
        setApiKeyMissing(!isApiKeySet());
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
        }

        return () => {
            audioContextRef.current?.close();
            if (activeAudio) {
                activeAudio.source.stop();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [conversation]);


    const handleSendQuery = async () => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery || isLoading) return;
        if (apiKeyMissing) {
            addToast('Please set your Gemini API Key in Settings to use this feature.', 'error');
            return;
        }

        const userMessage: Message = { id: Date.now(), sender: 'user', text: trimmedQuery };
        const newConversation = [...conversation, userMessage];
        setConversation(newConversation);
        setQuery('');
        setIsLoading(true);

        try {
            if (!selectedRepoFullName) {
                throw new Error("Please select a repository first.");
            }
            addToast('Fetching repository context...', 'info');
            const parsed = parseGitHubUrl(`https://github.com/${selectedRepoFullName}`);
            if (!parsed) throw new Error("Could not parse repository name.");

            const fileTree = await getRepoFileTree(parsed.owner, parsed.repo);
            const filesToFetch = fileTree
                .sort((a, b) => (a.size || 0) - (b.size || 0))
                .slice(0, 5);

            const fileContents = await Promise.all(
                filesToFetch.map(async file => ({
                    name: file.path,
                    content: await getFileContent(parsed.owner, parsed.repo, file.path)
                }))
            );

            addToast('Querying Sentinel AI...', 'info');
            const aiResponse = await queryRepoInsights(trimmedQuery, conversation, fileContents);
            setConversation([...newConversation, { id: Date.now() + 1, sender: 'ai', text: aiResponse }]);

        } catch (error: any) {
            addToast(error.message || 'An error occurred.', 'error');
            setConversation(conversation);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayAudio = async (message: Message) => {
        const audioContext = audioContextRef.current;
        if (!audioContext) {
            addToast('Audio playback is not supported on this browser.', 'error');
            return;
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (activeAudio?.messageId === message.id) {
            activeAudio.source.stop();
            setActiveAudio(null);
            return;
        }

        if (activeAudio) {
            activeAudio.source.stop();
        }

        setLoadingAudioId(message.id);
        try {
            const base64Audio = await generateSpeech(message.text);
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.onended = () => {
                setActiveAudio(prev => (prev?.messageId === message.id ? null : prev));
            };
            source.start();
            setActiveAudio({ messageId: message.id, source });
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setLoadingAudioId(null);
        }
    };

    const handleExportPdf = async () => {
        if (!window.jspdf || !window.html2canvas) {
            addToast('PDF generation library is still loading. Please try again in a moment.', 'info');
            return;
        }

        const { jsPDF } = window.jspdf;
        const chatElement = chatContainerRef.current;
        if (!chatElement || conversation.length === 0) {
            addToast('Nothing to export.', 'warning');
            return;
        }

        addToast('Generating PDF...', 'info');

        try {
            const canvas = await window.html2canvas(chatElement, {
                backgroundColor: '#000000',
                scale: 2,
                scrollY: -window.scrollY,
                windowWidth: chatElement.scrollWidth,
                windowHeight: chatElement.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`sentinel-chatbot-${new Date().toISOString().split('T')[0]}.pdf`);
            addToast('PDF exported successfully!', 'success');
        } catch (error) {
            console.error("PDF Export Error:", error);
            addToast('Failed to generate PDF.', 'error');
        }
    };

    if (apiKeyMissing) {
        return (
            <div className="h-full w-full flex items-center justify-center p-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <ErrorIcon className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 font-heading">API Key Required</h3>
                    <p className="text-gray-400 max-w-sm text-sm leading-relaxed mb-8">Please set your Gemini API key in Settings to use this feature.</p>
                    <motion.button
                        onClick={() => navigate('/app/settings')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-white text-black font-bold text-sm rounded-full flex items-center space-x-2 mx-auto hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
                    >
                        <SettingsIcon className="w-4 h-4" />
                        <span>Configure Access</span>
                    </motion.button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col space-y-4 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white font-heading tracking-tight">AURA</h1>
                        <p className="text-sm text-gray-400">AI-powered Universal Repository Assistant.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                    {repos.length > 0 && (
                        <select
                            value={selectedRepoFullName}
                            onChange={e => setSelectedRepoFullName(e.target.value)}
                            className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none cursor-pointer font-mono"
                        >
                            {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
                        </select>
                    )}
                    <motion.button
                        onClick={handleExportPdf}
                        disabled={conversation.length === 0}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-3 bg-white/5 text-gray-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                        title="Export PDF"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>

            {/* Chat Container */}
            <div ref={chatContainerRef} className="flex-grow bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 space-y-6 overflow-y-auto custom-scrollbar shadow-inner">
                {conversation.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full flex items-center justify-center mb-6 blur-xl absolute" />
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                                <RobotIcon className="w-10 h-10 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white font-heading mb-2">Start a Conversation</h3>
                            <p className="text-sm text-gray-500 max-w-sm mx-auto">Ask questions about your repository's code, architecture, or best practices.</p>
                        </div>
                    </div>
                )}
                <AnimatePresence>
                    {conversation.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}
                        >
                            {msg.sender === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                                    <RobotIcon className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className={`relative group max-w-2xl p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${msg.sender === 'user'
                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none'
                                : 'bg-white/10 border border-white/5 text-gray-200 rounded-bl-none backdrop-blur-md'
                                }`}>
                                <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
                                {msg.sender === 'ai' && (
                                    <motion.button
                                        onClick={() => handlePlayAudio(msg)}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="absolute -bottom-3 -right-3 p-2 rounded-full bg-black border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50 transition-all shadow-lg"
                                        title="Read aloud"
                                        disabled={loadingAudioId !== null && loadingAudioId !== msg.id}
                                    >
                                        {loadingAudioId === msg.id
                                            ? <SpinnerIcon className="w-3 h-3 animate-spin text-blue-400" />
                                            : <VolumeUpIcon className={`w-3 h-3 ${activeAudio?.messageId === msg.id ? 'text-blue-400' : ''}`} />
                                        }
                                    </motion.button>
                                )}
                            </div>
                            {msg.sender === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 border border-white/10 overflow-hidden">
                                    {user?.avatarUrl ? <img src={user.avatarUrl} alt="user" className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 text-gray-400" />}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <RobotIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 rounded-bl-none">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendQuery()}
                        placeholder={repos.length > 0 ? "Ask a question about the selected repository..." : "Add a repository to begin."}
                        disabled={isLoading || repos.length === 0}
                        className="w-full pl-6 pr-16 py-4 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm font-medium"
                    />
                    <div className="absolute right-2 flex items-center">
                        <motion.button
                            onClick={handleSendQuery}
                            disabled={isLoading || !query}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all"
                        >
                            {isLoading ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DevWorkflowStreamliner;