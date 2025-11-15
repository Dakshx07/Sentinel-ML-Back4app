import React, { useState, useEffect } from 'react';
import { SentinelLogoIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_STEPS = [
    'Initializing Sentinel AI...',
    'Parsing Code Structure...',
    'Analyzing Data Flows...',
    'Checking for Vulnerabilities...',
    'Compiling Security Report...',
];

interface AnalysisLoaderProps {
    progressText?: string;
    steps?: string[];
}

const AnalysisLoader: React.FC<AnalysisLoaderProps> = ({ progressText, steps = DEFAULT_STEPS }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (progressText) return;

        // Cycle through steps for a more dynamic feel
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 2200); // Slower, more deliberate pace
        return () => clearInterval(interval);
    }, [progressText, steps]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            {/* New Logo Animation */}
            <div className="relative w-32 h-32">
                {/* Outer ring - slow */}
                <div 
                    className="absolute inset-0 border-2 border-brand-cyan/20 rounded-full animate-spin"
                    style={{ animationDuration: '10s' }}
                ></div>
                {/* Middle ring - faster, reverse */}
                <div 
                    className="absolute inset-4 border border-brand-purple/30 rounded-full animate-spin"
                    style={{ animationDirection: 'reverse', animationDuration: '7s' }}
                ></div>
                
                {/* Pulsing core glow */}
                <div className="absolute inset-8 bg-brand-purple/20 rounded-full animate-pulse-slow"></div>

                {/* Central Icon */}
                <div className="absolute inset-8 flex items-center justify-center">
                    <SentinelLogoIcon className="w-12 h-12" />
                </div>
                
                {/* Scanner line */}
                <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div 
                        className="absolute top-1/2 left-1/2 w-[200%] h-0.5 bg-gradient-to-r from-transparent via-brand-cyan to-transparent origin-center animate-scanner-spin"
                        style={{ animationDuration: '2.5s' }}
                    ></div>
                </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-dark-text dark:text-light-text font-heading mt-8">
                 {progressText ? 'Scanning...' : 'Analyzing Code'}
            </h3>

            {/* Animated Text */}
            <div className="w-full max-w-sm h-6 mt-2 overflow-hidden text-sm font-mono text-medium-dark-text dark:text-medium-text">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={progressText || currentStep}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="truncate"
                    >
                        {progressText || steps[currentStep]}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AnalysisLoader;