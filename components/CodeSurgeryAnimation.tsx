import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldIcon, CpuChipIcon, CheckCircleIcon, SpinnerIcon } from './icons';

declare global {
    interface Window {
        hljs: any;
    }
}

type SurgeryStage = 'idle' | 'scanning' | 'diagnosing' | 'applyingFix' | 'closing' | 'secure';

const VitalsMonitor: React.FC<{ status: string; vulns: string; statusColor: string }> = ({ status, vulns, statusColor }) => (
    <div className="flex-1 bg-void-black p-4 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">System Vitals</p>
        <div className="mt-2 text-sm font-mono">
            <p><span className="text-gray-500">Status:</span> <span className={`font-bold ${statusColor}`}>{status}</span></p>
            <p><span className="text-gray-500">Threats:</span> <span className="font-bold text-white">{vulns}</span></p>
        </div>
    </div>
);

const LogEntry: React.FC<{ message: string; icon: React.ReactNode }> = ({ message, icon }) => (
    <motion.li
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        className="flex items-start space-x-2 text-xs md:text-sm"
    >
        <div className="w-4 h-4 flex-shrink-0 mt-0.5">{icon}</div>
        <span className="text-gray-300">{message}</span>
    </motion.li>
);

const CodeSurgeryAnimation: React.FC = () => {
    const [stage, setStage] = useState<SurgeryStage>('idle');
    const [log, setLog] = useState<string[]>([]);
    const [vitals, setVitals] = useState({ status: 'Stable', vulns: 'None Detected', color: 'text-green-400' });

    const codeRef = useRef<HTMLElement>(null);

    const code = useMemo(() => {
        const rawCode = `
<span class="text-purple-400">def</span> <span class="text-blue-400">get_product</span>(<span class="text-orange-400">product_id</span>):
    conn = get_db_connection()
    <span class="text-gray-500"># VULNERABILITY: Direct string formatting</span>
    product = conn.execute(f<span class="text-green-400">"SELECT * FROM products WHERE id = '{product_id}'"</span>).fetchone()
    conn.close()
    <span class="text-purple-400">return</span> jsonify(dict(product))
    `;
        return rawCode.trim().split('\n');
    }, []);

    const fixedCodeHTML = `
        <div class="bg-green-500/10 rounded -mx-4 px-4 py-1 border-l-2 border-green-500" style="white-space: pre-wrap; overflow-wrap: break-word;">
            <span class="text-gray-500">    # FIX: Use parameterized query</span><br/>
            <span class="text-gray-300">    product = conn.execute(<span class="text-green-400">"SELECT * FROM products WHERE id = ?"</span>, (product_id,)).fetchone()</span>
        </div>
    `;

    const vulnerableLineIndex = 3;

    const runSequence = () => {
        setStage('scanning');
        setVitals({ status: 'Scanning...', vulns: 'Analyzing...', color: 'text-neon-cyan' });
        setLog(l => [...l, "Initiating deep tissue scan..."]);

        setTimeout(() => {
            setStage('diagnosing');
            setVitals({ status: 'CRITICAL', vulns: '1 SQL Injection', color: 'text-red-500 animate-pulse' });
            setLog(l => [...l, "CRITICAL FINDING: SQL Injection vector detected."]);
        }, 2500);

        setTimeout(() => {
            setStage('applyingFix');
            setVitals({ status: 'Patching...', vulns: '1 Critical', color: 'text-yellow-400' });
            setLog(l => [...l, "Isolating vulnerable segment...", "Applying parametric suture..."]);
        }, 5000);

        setTimeout(() => {
            setLog(l => [...l, "Injection vector neutralized."]);
        }, 6500);

        setTimeout(() => {
            setStage('closing');
            setVitals({ status: 'Stabilizing...', vulns: '0', color: 'text-green-400' });
            setLog(l => [...l, "Closing code block. Verifying integrity..."]);
        }, 8000);

        setTimeout(() => {
            setStage('secure');
            setVitals({ status: 'SECURE', vulns: '0', color: 'text-green-400' });
            setLog(l => [...l, "Procedure complete. System hardened."]);
        }, 9500);
    };

    const reset = () => {
        setStage('idle');
        setLog([]);
        setVitals({ status: 'Stable', vulns: 'None Detected', color: 'text-green-400' });
    };

    const getLogIcon = (index: number) => {
        if (stage === 'secure' && index === log.length - 1) return <CheckCircleIcon className="text-green-400" />;
        if (stage === 'diagnosing' && index === log.length - 1) return <ShieldIcon severity="Critical" className="text-red-500" />;
        return <CpuChipIcon className="text-neon-cyan" />;
    };

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
                {/* Left Panel: Vitals & Log */}
                <div className="lg:col-span-1 space-y-4">
                    <VitalsMonitor status={vitals.status} vulns={vitals.vulns} statusColor={vitals.color} />
                    <div className="bg-void-black p-4 rounded-xl border border-white/10 h-80 flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex-shrink-0 font-mono">Sentinel Log</p>
                        <ul className="font-mono space-y-3 overflow-y-auto flex-grow pr-2 custom-scrollbar">
                            <AnimatePresence>
                                {log.map((msg, i) => <LogEntry key={i} message={msg} icon={getLogIcon(i)} />)}
                            </AnimatePresence>
                        </ul>
                    </div>
                </div>

                {/* Right Panel: Operating Theater */}
                <div className="lg:col-span-2 bg-void-black p-1 rounded-xl border border-white/10 flex flex-col shadow-[0_0_30px_rgba(0,243,255,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-electric-purple to-neon-cyan opacity-50"></div>

                    <div className="p-4 md:p-6 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                <h3 className="text-lg font-bold font-heading text-white tracking-wide">LIVE CODE SURGERY</h3>
                            </div>
                            <div>
                                {stage === 'idle' && <button onClick={runSequence} className="bg-white text-black font-bold py-2 px-6 rounded hover:bg-neon-cyan transition-colors text-sm">Start Procedure</button>}
                                {stage === 'secure' && <button onClick={reset} className="border border-white/20 text-white py-2 px-6 rounded hover:bg-white/10 transition-colors text-sm">Reset Simulation</button>}
                                {stage !== 'idle' && stage !== 'secure' &&
                                    <button disabled className="bg-white/10 text-white py-2 px-6 rounded opacity-50 flex items-center text-sm cursor-not-allowed"><SpinnerIcon className="w-4 h-4 mr-2" /> Processing...</button>
                                }
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] rounded-lg p-6 font-mono text-sm relative overflow-hidden flex-grow border border-white/5">
                            <AnimatePresence>
                                {stage === 'scanning' &&
                                    <motion.div
                                        initial={{ top: '0%' }} animate={{ top: '100%' }}
                                        transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                                        exit={{ opacity: 0 }}
                                        className="absolute left-0 w-full h-0.5 bg-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.8)] z-10"
                                    />
                                }
                            </AnimatePresence>
                            <pre className="whitespace-pre-wrap break-words text-gray-300 relative z-0"><code ref={codeRef}>
                                {code.map((line, i) => (
                                    <div key={i} className="overflow-hidden relative">
                                        <AnimatePresence initial={false}>
                                            {!(stage === 'applyingFix' || stage === 'closing' || stage === 'secure') || i !== vulnerableLineIndex ? (
                                                <motion.div
                                                    key="original"
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    animate={{
                                                        backgroundColor: stage === 'diagnosing' && i === vulnerableLineIndex ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                                    }}
                                                    className={`block ${stage === 'diagnosing' && i === vulnerableLineIndex ? 'border-l-2 border-red-500 pl-2 -ml-2' : ''}`}
                                                    dangerouslySetInnerHTML={{ __html: line || ' ' }}
                                                />
                                            ) : (
                                                <motion.div
                                                    key="fixed"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    transition={{ duration: 0.4, delay: 0.3, ease: 'easeInOut' }}
                                                    dangerouslySetInnerHTML={{ __html: fixedCodeHTML }}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </code></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeSurgeryAnimation;