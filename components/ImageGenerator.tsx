import React, { useState } from 'react';
import { useToast } from './ToastContext';
import { ImageIcon, SpinnerIcon, ErrorIcon, SettingsIcon, BrainCircuitIcon, MagicWandIcon, DownloadIcon, SparklesIcon } from './icons';
import { generateImage, isApiKeySet, getImagePromptSuggestions } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageGeneratorProps {
    onNavigateToSettings: () => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onNavigateToSettings }) => {
    const { addToast } = useToast();
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const apiKeyMissing = !isApiKeySet();

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            addToast('Please enter a prompt to generate an image.', 'warning');
            return;
        }
        setIsLoading(true);
        setImageUrl('');
        setSuggestions([]);
        try {
            const url = await generateImage(prompt);
            setImageUrl(url);
            addToast('Image generated successfully!', 'success');
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetSuggestions = async () => {
        if (!prompt.trim()) {
            addToast('Enter a basic prompt first to get suggestions.', 'warning');
            return;
        }
        setIsSuggesting(true);
        setSuggestions([]);
        try {
            const newSuggestions = await getImagePromptSuggestions(prompt);
            setSuggestions(newSuggestions);
        } catch (e: any) {
            addToast(e.message, 'error');
        } finally {
            setIsSuggesting(false);
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
                    <p className="text-gray-400 max-w-sm text-sm leading-relaxed mb-8">Please set your API key in Settings to use the Image Generator.</p>
                    <motion.button
                        onClick={onNavigateToSettings}
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
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                        <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white font-heading tracking-tight">Image Generator</h1>
                        <p className="text-sm text-gray-400">AI-powered visual creation studio.</p>
                    </div>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
                {/* Input Panel */}
                <div className="lg:col-span-4 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col shadow-2xl">
                    <h2 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wider mb-4">Prompt Engineering</h2>

                    <div className="relative flex-grow flex flex-col">
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                            placeholder="Describe the image you want to generate... e.g., A futuristic cybersecurity dashboard displaying a network attack in neon colors."
                            disabled={isLoading}
                            className="w-full flex-grow p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none text-sm leading-relaxed"
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] text-gray-600 font-mono">
                            {prompt.length} chars
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        <motion.button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-xl disabled:opacity-50 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center space-x-2"
                        >
                            {isLoading ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <MagicWandIcon className="w-4 h-4" />}
                            <span>Generate Image</span>
                        </motion.button>

                        <motion.button
                            onClick={handleGetSuggestions}
                            disabled={isSuggesting || isLoading || !prompt}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:bg-white/10 font-bold text-sm rounded-xl disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                        >
                            {isSuggesting ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <BrainCircuitIcon className="w-4 h-4" />}
                            <span>Enhance Prompt</span>
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 overflow-hidden"
                            >
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Suggestions</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                    {suggestions.map((s, i) => (
                                        <motion.button
                                            key={i}
                                            onClick={() => setPrompt(s)}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="w-full text-left text-xs text-gray-400 bg-white/5 border border-white/5 p-3 rounded-lg hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30 transition-all"
                                        >
                                            <div className="flex items-start space-x-2">
                                                <SparklesIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{s}</span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h2 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wider">Generated Image</h2>
                        {imageUrl && !isLoading && (
                            <motion.a
                                href={imageUrl}
                                download="sentinel-generated-image.png"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-all"
                            >
                                <DownloadIcon className="w-3 h-3" />
                                <span>Download</span>
                            </motion.a>
                        )}
                    </div>

                    <div className="flex-grow flex items-center justify-center bg-black rounded-2xl border border-white/5 overflow-hidden relative">
                        {isLoading && (
                            <div className="text-center z-10">
                                <div className="relative w-24 h-24 mx-auto mb-6">
                                    {/* Animated gradient ring */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full border-2 border-transparent"
                                        style={{ borderTopColor: '#a855f7', borderRightColor: '#a855f740' }}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    />
                                    <motion.div
                                        className="absolute inset-2 rounded-full border-2 border-transparent"
                                        style={{ borderBottomColor: '#ec4899', borderLeftColor: '#ec489940' }}
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                    {/* Center icon */}
                                    <motion.div
                                        className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <MagicWandIcon className="w-8 h-8 text-purple-400" />
                                    </motion.div>
                                </div>
                                <motion.h3
                                    className="text-lg font-bold text-white"
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    Creating Vision...
                                </motion.h3>
                                <p className="mt-2 text-sm text-gray-500">Generating high-fidelity visuals</p>
                            </div>
                        )}

                        {!isLoading && imageUrl && (
                            <motion.img
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={imageUrl}
                                alt={prompt}
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                            />
                        )}

                        {!isLoading && !imageUrl && (
                            <div className="text-center opacity-40">
                                <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                                    <ImageIcon className="w-10 h-10 text-white" />
                                </div>
                                <p className="text-sm font-medium text-white">Your creation will appear here</p>
                                <p className="text-xs text-gray-500 mt-1">Enter a prompt and generate</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGenerator;