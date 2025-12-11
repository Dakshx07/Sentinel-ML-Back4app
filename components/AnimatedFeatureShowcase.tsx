import React, { useState } from 'react';
import { BrainCircuitIcon, BoltIcon, CpuChipIcon, GitBranchIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

type Feature = 'analysis' | 'fixes' | 'cicd' | 'gitops';

const AnimatedFeatureShowcase: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState<Feature>('analysis');

    const features = [
        { id: 'analysis' as Feature, title: 'Deep Code Analysis', icon: <BrainCircuitIcon className="w-6 h-6" />, description: "Sentinel's AI goes beyond static checks, understanding your code's context and logic to find vulnerabilities others miss." },
        { id: 'fixes' as Feature, title: 'Instant, Actionable Fixes', icon: <BoltIcon className="w-6 h-6" />, description: "Don't just find problems—fix them. Get immediate, production-ready code suggestions to resolve issues in seconds." },
        { id: 'cicd' as Feature, title: 'Seamless CI/CD Integration', icon: <CpuChipIcon className="w-6 h-6" />, description: "Integrate Sentinel directly into your pipeline to automate security reviews and block vulnerabilities before they are merged." },
        { id: 'gitops' as Feature, title: 'AI-Powered GitOps', icon: <GitBranchIcon className="w-6 h-6" />, description: "Review pull requests, analyze commit history, and create fix PRs with a single click, all powered by AI." }
    ];

    const renderVisualization = () => {
        const visualizationVariants = {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -20 },
        };

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeFeature}
                    variants={visualizationVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="relative w-full h-64 bg-void-black p-6 rounded-2xl font-mono text-xs md:text-sm text-gray-400 overflow-hidden border border-white/10 shadow-2xl shadow-neon-cyan/5"
                >
                    {activeFeature === 'analysis' && (
                        <div className="flex flex-col h-full justify-center space-y-2">
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>&gt; <span className="text-neon-cyan">sentinel scan</span> --target ./src</motion.p>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>&gt; Analyzing <span className="text-white">app.py</span>...</motion.p>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>&gt; Parsing abstract syntax tree...</motion.p>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>&gt; Checking data flow for SQL injection...</motion.p>
                            <motion.div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.6 }}>
                                <p className="text-red-400 font-bold flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>VULNERABILITY DETECTED</p>
                                <p className="text-white mt-1">SQL Injection on line 15.</p>
                            </motion.div>
                        </div>
                    )}
                    {activeFeature === 'fixes' && (
                        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 h-full">
                            <div className="w-full md:w-1/2 border border-red-500/20 bg-red-500/5 rounded p-3 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl">UNSAFE</div>
                                <p className="text-red-400 font-bold mb-2">// Vulnerable</p>
                                <p className="text-gray-300">query = f"SELECT * FROM users</p>
                                <p className="text-gray-300">{`WHERE id = '{user_id}'"`}</p>
                            </div>
                            <div className="hidden md:flex items-center justify-center text-neon-cyan">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </div>
                            <div className="w-full md:w-1/2 border border-green-500/20 bg-green-500/5 rounded p-3 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] px-2 py-0.5 rounded-bl font-bold">SECURE</div>
                                <p className="text-green-400 font-bold mb-2">// Fixed</p>
                                <p className="text-gray-300">query = "SELECT * FROM users</p>
                                <p className="text-gray-300">WHERE id = ?"</p>
                                <p className="text-gray-300">{`db.execute(query, (user_id,))`}</p>
                            </div>
                        </div>
                    )}
                    {activeFeature === 'cicd' && (
                        <div className="flex items-center justify-around h-full relative">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0"></div>

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2">
                                    <span className="text-lg">💻</span>
                                </div>
                                <span className="text-gray-400 text-[10px] uppercase tracking-wider">Commit</span>
                            </div>

                            <motion.div
                                className="relative z-10 flex flex-col items-center"
                                initial={{ scale: 0.8, opacity: 0.5 }}
                                animate={{ scale: 1.1, opacity: 1 }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <div className="w-12 h-12 rounded-full bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                                    <span className="text-xl">🤖</span>
                                </div>
                                <span className="text-neon-cyan text-[10px] uppercase tracking-wider font-bold">Sentinel Scan</span>
                            </motion.div>

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mb-2">
                                    <span className="text-lg">🚀</span>
                                </div>
                                <span className="text-green-400 text-[10px] uppercase tracking-wider">Deploy</span>
                            </div>
                        </div>
                    )}
                    {activeFeature === 'gitops' && (
                        <div className="flex flex-col h-full justify-center text-center space-y-4">
                            <motion.div className="bg-white/5 border border-white/10 rounded p-3 mx-auto w-3/4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <p className="text-white text-sm"><span className="text-purple-400">PR #125</span>: "Add User Profile Page"</p>
                            </motion.div>

                            <motion.div className="flex justify-center" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                                <div className="h-8 w-0.5 bg-white/20"></div>
                            </motion.div>

                            <motion.div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded p-3 mx-auto w-3/4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                                <p className="text-neon-cyan text-sm font-bold">Sentinel Bot</p>
                                <p className="text-gray-300 text-xs mt-1">Found XSS vulnerability. Pushed fix commit <code className="bg-black/30 px-1 rounded">a4e3f2d</code>.</p>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-3">
                    {features.map(feature => (
                        <button
                            key={feature.id}
                            onClick={() => setActiveFeature(feature.id)}
                            className={`w-full text-left p-5 rounded-xl transition-all duration-300 border ${activeFeature === feature.id ? 'bg-white/10 border-neon-cyan shadow-[0_0_20px_rgba(0,243,255,0.1)]' : 'bg-transparent border-white/5 hover:bg-white/5 hover:border-white/20'}`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`p-2.5 rounded-lg transition-colors duration-300 ${activeFeature === feature.id ? 'bg-neon-cyan text-black' : 'bg-white/5 text-gray-400'}`}>
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${activeFeature === feature.id ? 'text-white' : 'text-gray-400'}`}>{feature.title}</h3>
                                    <p className={`text-xs mt-1 leading-relaxed ${activeFeature === feature.id ? 'text-gray-300' : 'text-gray-500'}`}>{feature.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="lg:col-span-7 flex items-center justify-center">
                    {renderVisualization()}
                </div>
            </div>
        </div>
    );
};

export default AnimatedFeatureShowcase;