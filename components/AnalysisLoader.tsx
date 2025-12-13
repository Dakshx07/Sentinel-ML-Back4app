import React, { useState, useEffect } from 'react';
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

        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 2200);
        return () => clearInterval(interval);
    }, [progressText, steps]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            {/* New Modern Loader Animation */}
            <div className="relative w-40 h-40">
                {/* Outer glow ring */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Spinning outer ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-transparent"
                    style={{
                        borderTopColor: '#22c55e',
                        borderRightColor: '#22c55e40',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {/* Second spinning ring - reverse */}
                <motion.div
                    className="absolute inset-4 rounded-full border-2 border-transparent"
                    style={{
                        borderBottomColor: '#16a34a',
                        borderLeftColor: '#16a34a40',
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                {/* Pulsing inner circle */}
                <motion.div
                    className="absolute inset-8 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Central Logo - X symbol */}
                <div className="absolute inset-8 flex items-center justify-center">
                    <motion.div
                        className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)]"
                        animate={{ scale: [1, 0.95, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M6 6L18 18M18 6L6 18" />
                        </svg>
                    </motion.div>
                </div>

                {/* Orbiting dots */}
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                        style={{
                            top: '50%',
                            left: '50%',
                            marginTop: -4,
                            marginLeft: -4,
                        }}
                        animate={{
                            x: [0, Math.cos((i * Math.PI) / 2) * 70, 0],
                            y: [0, Math.sin((i * Math.PI) / 2) * 70, 0],
                            opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.5,
                        }}
                    />
                ))}
            </div>

            {/* Title */}
            <motion.h3
                className="text-xl font-bold text-white mt-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {progressText ? 'Processing...' : 'Analyzing Code'}
            </motion.h3>

            {/* Animated Status Text */}
            <div className="w-full max-w-sm h-6 mt-3 overflow-hidden text-sm font-mono text-gray-400">
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

            {/* Progress Indicator */}
            <div className="flex space-x-2 mt-4">
                {steps.map((_, i) => (
                    <motion.div
                        key={i}
                        className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-green-500' : 'bg-white/10'}`}
                        animate={i === currentStep ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    />
                ))}
            </div>
        </div>
    );
};

export default AnalysisLoader;