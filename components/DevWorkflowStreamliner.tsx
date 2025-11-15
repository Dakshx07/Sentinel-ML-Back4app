import React, { useState, useEffect, useRef } from 'react';
import { Repository, User } from '../types';
import { useToast } from './ToastContext';
import { CpuChipIcon, SpinnerIcon, ErrorIcon, SettingsIcon, VolumeUpIcon } from './icons';
import { getRepoFileTree, getFileContent, parseGitHubUrl } from '../services/githubService';
import { queryRepoInsights, isApiKeySet, generateSpeech } from '../services/geminiService';

// Declare jsPDF and html2canvas on the global window object to resolve TypeScript errors.
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

// --- START: Audio Utilities for TTS ---
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
// --- END: Audio Utilities for TTS ---


const DevWorkflowStreamliner: React.FC<DevWorkflowStreamlinerProps> = ({ repos, user, onNavigateToSettings }) => {
    const { addToast } = useToast();
    const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>('');
    const [query, setQuery] = useState('');
    const [conversation, setConversation] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeyMissing, setApiKeyMissing] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    // TTS State
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
        // Initialize AudioContext. It's safe to create it on mount.
        // It will be suspended until user interaction triggers audio playback.
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
                .sort((a,b) => (a.size || 0) - (b.size || 0))
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
            setConversation(conversation); // Revert conversation on error
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
        
        // Resume context if it's suspended
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
                backgroundColor: document.documentElement.classList.contains('dark') ? '#0A0A1F' : '#F3F4F6',
                scale: 2,
                scrollY: -window.scrollY, // Ensure it captures from the top
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
            <div className="h-full w-full flex items-center justify-center p-4 glass-effect rounded-lg">
                <div className="text-center">
                     <ErrorIcon className="w-12 h-12 text-yellow-500 mb-4 mx-auto" />
                     <h3 className="text-lg font-bold text-dark-text dark:text-white font-heading">Gemini API Key Required</h3>
                     <p className="mt-2 text-medium-dark-text dark:text-medium-text max-w-sm">Please set your API key in Settings to use this feature.</p>
                     <button onClick={onNavigateToSettings} className="mt-6 flex items-center justify-center btn-primary mx-auto">
                        <SettingsIcon className="w-5 h-5 mr-2" />
                        Go to Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                 <div className="flex items-center space-x-3">
                    <CpuChipIcon className="w-8 h-8 text-brand-purple" />
                    <div>
                        <h1 className="text-3xl font-bold text-dark-text dark:text-white font-heading">Repo Chatbot</h1>
                        <p className="mt-1 text-medium-dark-text dark:text-medium-text">AI-powered assistant for your repositories.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                     {repos.length > 0 && (
                        <select
                            value={selectedRepoFullName}
                            onChange={e => setSelectedRepoFullName(e.target.value)}
                            className="w-full md:w-60 bg-light-secondary dark:bg-dark-secondary border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm"
                        >
                            {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>)}
                        </select>
                    )}
                    <button onClick={handleExportPdf} className="btn-secondary py-2 px-4" disabled={conversation.length === 0}>Export PDF</button>
                </div>
            </div>
            
            <div ref={chatContainerRef} className="flex-grow glass-effect rounded-lg p-4 space-y-4 overflow-y-auto">
                {conversation.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center flex-shrink-0">🤖</div>}
                        <div className={`relative group max-w-xl p-3 rounded-lg ${msg.sender === 'user' ? 'bg-brand-cyan/20' : 'bg-light-primary dark:bg-dark-primary'}`}>
                           <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                           {msg.sender === 'ai' && (
                               <button 
                                   onClick={() => handlePlayAudio(msg)} 
                                   className="absolute -bottom-3 -right-3 p-1.5 rounded-full bg-light-secondary dark:bg-dark-secondary border border-gray-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                   title="Read aloud"
                                   disabled={loadingAudioId !== null && loadingAudioId !== msg.id}
                                >
                                   {loadingAudioId === msg.id 
                                       ? <SpinnerIcon className="w-4 h-4" />
                                       : <VolumeUpIcon className={`w-4 h-4 ${activeAudio?.messageId === msg.id ? 'text-brand-cyan' : ''}`} />
                                   }
                               </button>
                           )}
                        </div>
                         {msg.sender === 'user' && <img src={user?.avatarUrl} alt="user" className="w-8 h-8 rounded-full flex-shrink-0"/>}
                    </div>
                ))}
                 {isLoading && (
                     <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center flex-shrink-0"><SpinnerIcon className="w-5 h-5"/></div>
                         <div className="max-w-xl p-3 rounded-lg bg-light-primary dark:bg-dark-primary"><p className="text-sm">Thinking...</p></div>
                     </div>
                 )}
            </div>

            <div className="flex-shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSendQuery()}
                        placeholder={repos.length > 0 ? "Ask a question about the selected repository..." : "Add a repository to begin."}
                        disabled={isLoading || repos.length === 0}
                        className="w-full p-4 pr-32 bg-light-secondary dark:bg-dark-secondary border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    />
                    <button onClick={handleSendQuery} disabled={isLoading || !query} className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary py-2 px-5 disabled:opacity-50">
                        {isLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DevWorkflowStreamliner;