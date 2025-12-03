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
                    className="relative w-full h-48 bg-light-secondary dark:bg-dark-secondary p-4 rounded-lg font-mono text-xs md:text-sm text-gray-500 dark:text-gray-400 overflow-hidden border border-gray-200 dark:border-white/10"
                >
                    {activeFeature === 'analysis' && (
                        <div className="flex flex-col h-full justify-center">
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>&gt; Analyzing <span className="text-brand-cyan">app.py</span>...</motion.p>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>&gt; Parsing abstract syntax tree...</motion.p>
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>&gt; Checking data flow for SQL injection...</motion.p>
                            <motion.p className="mt-4 text-red-400 font-bold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>&gt; VULNERABILITY FOUND: SQL Injection on line 15.</motion.p>
                        </div>
                    )}
                    {activeFeature === 'fixes' && (
                        <div className="flex space-x-4 h-full">
                            <div className="w-1/2 border-r-2 border-dashed border-red-500/50 pr-2 flex flex-col justify-center">
                                <p className="text-red-400 font-bold">// Before</p>
                                <p>query = f"SELECT * FROM products</p>
                                <p>{`WHERE id = '{product_id}'`}</p>
                            </div>
                            <div className="w-1/2 flex flex-col justify-center">
                                <p className="text-green-400 font-bold">// After (Secure)</p>
                                <p>query = "SELECT * FROM products</p>
                                <p>WHERE id = ?"</p>
                                <p>{`conn.execute(query, (product_id,))`}</p>
                            </div>
                        </div>
                    )}
                    {activeFeature === 'cicd' && (
                        <div className="flex items-center justify-around h-full">
                            <span className="text-green-400">✅ Commit</span>
                            <div className="w-1/4 h-1 bg-brand-cyan/20 rounded-full overflow-hidden">
                                <motion.div className="h-1 bg-brand-cyan" initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }} />
                            </div>
                            <span className="text-brand-cyan">🤖 Sentinel Scan</span>
                            <div className="w-1/4 h-1 bg-brand-cyan/20 rounded-full overflow-hidden">
                                <motion.div className="h-1 bg-brand-cyan" initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.8, ease: "easeInOut" }} />
                            </div>
                            <span className="text-green-400">🚀 Deploy</span>
                        </div>
                    )}
                    {activeFeature === 'gitops' && (
                        <div className="flex flex-col h-full justify-center text-center">
                            <motion.p className="text-brand-cyan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>PR #125: "Add User Profile Page"</motion.p>
                            <motion.p className="text-yellow-400 mt-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>Sentinel: Found XSS vulnerability in `Profile.js`</motion.p>
                            <motion.p className="text-green-400 mt-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>Sentinel: Pushed commit `a4e3f2d` with a suggested fix.</motion.p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 space-y-4">
                    {features.map(feature => (
                        <motion.button
                            key={feature.id}
                            onClick={() => setActiveFeature(feature.id)}
                            whileHover={{ scale: 1.02 }}
                            className={`w-full text-left p-6 rounded-2xl transition-colors duration-200 border-2 ${activeFeature === feature.id ? 'bg-light-secondary dark:bg-dark-secondary border-brand-purple' : 'bg-light-primary dark:bg-dark-primary border-gray-200 dark:border-white/10 hover:border-brand-purple/50'}`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-lg transition-colors duration-300 ${activeFeature === feature.id ? 'bg-brand-purple text-white' : 'bg-light-secondary dark:bg-dark-secondary text-brand-cyan'}`}>
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-dark-text dark:text-white">{feature.title}</h3>
                                    <p className="text-sm text-medium-dark-text dark:text-medium-text mt-1">{feature.description}</p>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
                <div className="lg:col-span-7 min-h-[250px] flex items-center justify-center">
                    {renderVisualization()}
                </div>
            </div>
        </div>
    );
};

export default AnimatedFeatureShowcase;