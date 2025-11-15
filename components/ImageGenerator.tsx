import React, { useState } from 'react';
import { useToast } from './ToastContext';
import { ImageIcon, SpinnerIcon, ErrorIcon, SettingsIcon, BrainCircuitIcon } from './icons';
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
            <div className="h-full w-full flex items-center justify-center p-4 glass-effect rounded-lg">
                <div className="text-center">
                    <ErrorIcon className="w-12 h-12 text-yellow-500 mb-4 mx-auto" />
                    <h3 className="text-lg font-bold text-dark-text dark:text-white font-heading">Gemini API Key Required</h3>
                    <p className="mt-2 text-medium-dark-text dark:text-medium-text max-w-sm">Please set your API key in Settings to use the Image Generator.</p>
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
            <div className="flex items-center space-x-3">
                <ImageIcon className="w-8 h-8 text-brand-purple" />
                <div>
                    <h1 className="text-3xl font-bold text-dark-text dark:text-white font-heading">Image Generator</h1>
                    <p className="mt-1 text-medium-dark-text dark:text-medium-text">Create visual representations of code structures, attack flows, or any concept.</p>
                </div>
            </div>

            <div className="flex-shrink-0">
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
                        placeholder="e.g., A dependency graph for a web application, cyberpunk style, digital art..."
                        disabled={isLoading}
                        rows={2}
                        className="w-full p-4 pr-36 bg-light-secondary dark:bg-dark-secondary border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
                    />
                    <button onClick={handleGenerate} disabled={isLoading || !prompt} className="absolute right-3 top-3 btn-primary py-2 px-5 disabled:opacity-50">
                        {isLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Generate'}
                    </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                     <button onClick={handleGetSuggestions} disabled={isSuggesting || isLoading || !prompt} className="btn-secondary flex items-center space-x-2 text-sm py-2 px-4 disabled:opacity-50">
                        {isSuggesting ? <SpinnerIcon className="w-5 h-5"/> : <BrainCircuitIcon className="w-5 h-5" />}
                        <span>Get Suggestions</span>
                    </button>
                     {imageUrl && !isLoading && (
                        <a href={imageUrl} download="sentinel-generated-image.png" className="btn-secondary text-sm py-2 px-4">
                            Download
                        </a>
                    )}
                </div>
                 <AnimatePresence>
                    {suggestions.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
                        >
                            {suggestions.map((s, i) => (
                                <motion.button 
                                    key={i} 
                                    onClick={() => setPrompt(s)}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="text-left text-sm bg-light-secondary dark:bg-dark-secondary border border-gray-200 dark:border-white/10 p-3 rounded-lg hover:bg-brand-purple/10 hover:border-brand-purple transition-all"
                                >
                                    {s}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="flex-grow glass-effect rounded-lg p-4 flex items-center justify-center">
                {isLoading && (
                    <div className="text-center">
                        <SpinnerIcon className="w-10 h-10 text-brand-purple mx-auto" />
                        <p className="mt-3 text-medium-dark-text dark:text-medium-text">Generating image... this can take a moment.</p>
                    </div>
                )}
                {!isLoading && imageUrl && (
                    <img src={imageUrl} alt={prompt} className="max-w-full max-h-full object-contain rounded-md" />
                )}
                {!isLoading && !imageUrl && (
                    <div className="text-center text-medium-dark-text dark:text-medium-text">
                        <ImageIcon className="w-16 h-16 mx-auto opacity-10" />
                        <p className="mt-4">Your generated image will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageGenerator;