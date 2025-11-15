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
    <div className="flex-1 glass-effect p-4 rounded-lg border border-white/10">
        <p className="text-xs text-medium-text uppercase tracking-wider">Patient Vitals</p>
        <div className="mt-2 text-sm">
            <p><span className="text-medium-text">Status:</span> <span className={`font-bold ${statusColor}`}>{status}</span></p>
            <p><span className="text-medium-text">Vulnerabilities:</span> <span className="font-bold text-white">{vulns}</span></p>
        </div>
    </div>
);

const LogEntry: React.FC<{ message: string; icon: React.ReactNode }> = ({ message, icon }) => (
    <motion.li
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex items-start space-x-2"
    >
        <div className="w-4 h-4 flex-shrink-0 mt-0.5">{icon}</div>
        <span>{message}</span>
    </motion.li>
);

const CodeSurgeryAnimation: React.FC = () => {
    const [stage, setStage] = useState<SurgeryStage>('idle');
    const [log, setLog] = useState<string[]>([]);
    const [vitals, setVitals] = useState({ status: 'Stable', vulns: 'Unknown', color: 'text-green-400' });
    
    const codeRef = useRef<HTMLElement>(null);

    const code = useMemo(() => {
        const rawCode = `
<span class="hljs-keyword">def</span> <span class="hljs-title function_">get_product</span>(<span class="hljs-params">product_id</span>):
    conn = get_db_connection()
    <span class="hljs-comment"># VULNERABILITY: Direct string formatting</span>
    product = conn.execute(f<span class="hljs-string">"SELECT * FROM products WHERE id = '{product_id}'"</span>).fetchone()
    conn.close()
    <span class="hljs-keyword">return</span> jsonify(dict(product))
    `;
        return rawCode.trim().split('\n');
    }, []);

    const fixedCodeHTML = `
        <div class="bg-green-900/30 rounded -mx-4 px-4 py-1" style="white-space: pre-wrap; overflow-wrap: break-word;">
            <span class="hljs-comment">    # FIX: Use parameterized query</span><br/>
            <span class="">    product = conn.execute(<span class="hljs-string">"SELECT * FROM products WHERE id = ?"</span>, (product_id,)).fetchone()</span>
        </div>
    `;

    const vulnerableLineIndex = 3;

    const runSequence = () => {
        setStage('scanning');
        setVitals({ status: 'Scanning...', vulns: 'Unknown', color: 'text-yellow-400' });
        setLog(l => [...l, "Initiating deep tissue scan..."]);

        setTimeout(() => {
            setStage('diagnosing');
            setVitals({ status: 'Unstable', vulns: '1 Critical', color: 'text-red-400' });
            setLog(l => [...l, "CRITICAL FINDING: SQL Injection vector detected."]);
        }, 2500);

        setTimeout(() => {
            setStage('applyingFix');
            setVitals({ status: 'Applying Suture...', vulns: '1 Critical', color: 'text-yellow-400' });
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
            setVitals({ status: 'Secure', vulns: '0', color: 'text-green-400' });
            setLog(l => [...l, "Procedure complete. Patient is stable."]);
        }, 9500);
    };

    const reset = () => {
        setStage('idle');
        setLog([]);
        setVitals({ status: 'Stable', vulns: 'Unknown', color: 'text-green-400' });
    };
    
    const getLogIcon = (index: number) => {
        if (stage === 'secure' && index === log.length - 1) return <CheckCircleIcon className="text-green-400" />;
        if (stage === 'diagnosing' && index === log.length - 1) return <ShieldIcon severity="Critical" />;
        return <CpuChipIcon className="text-brand-cyan/70" />;
    };

    return (
        <section id="live-demo" className="py-24 bg-light-secondary dark:bg-dark-primary relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-20 dark:opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-light-secondary dark:to-dark-primary"></div>
            
            <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-dark-text dark:text-white font-heading mb-4">Open Code Surgery</h2>
                <p className="max-w-3xl mx-auto text-lg text-medium-dark-text dark:text-medium-text mb-12">
                   This is not a demo. It's a live medical procedure on code. Watch Sentinel's AI surgeons find, fix, and secure a critical vulnerability in real-time.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
                    {/* Left Panel: Vitals & Log */}
                    <div className="lg:col-span-1 space-y-4">
                        <VitalsMonitor status={vitals.status} vulns={vitals.vulns} statusColor={vitals.color} />
                        <div className="glass-effect p-4 rounded-lg border border-white/10 h-80 flex flex-col">
                             <p className="text-xs text-medium-text uppercase tracking-wider mb-2 flex-shrink-0">AI Surgeon's Log</p>
                             <ul className="text-sm text-light-text font-mono space-y-2 overflow-y-auto flex-grow pr-2">
                                <AnimatePresence>
                                  {log.map((msg, i) => <LogEntry key={i} message={msg} icon={getLogIcon(i)} />)}
                                </AnimatePresence>
                             </ul>
                        </div>
                    </div>

                    {/* Right Panel: Operating Theater */}
                    <div className="lg:col-span-2 glass-effect p-4 md:p-6 rounded-lg border border-white/10 flex flex-col">
                        <div className="flex justify-between items-center mb-4 flex-shrink-0">
                            <h3 className="text-lg font-bold font-heading text-dark-text dark:text-white">Operating Theater</h3>
                            <div>
                                {stage === 'idle' && <button onClick={runSequence} className="btn-primary py-2 px-4">Start Procedure</button>}
                                {stage === 'secure' && <button onClick={reset} className="btn-secondary py-2 px-4">Run Again</button>}
                                {stage !== 'idle' && stage !== 'secure' && 
                                    <button disabled className="btn-primary py-2 px-4 opacity-50 flex items-center"><SpinnerIcon className="w-4 h-4 mr-2" /> In Progress...</button>
                                }
                            </div>
                        </div>
                        
                        <div className="bg-light-primary dark:bg-dark-primary rounded-md p-4 font-mono text-sm relative overflow-hidden flex-grow">
                            <AnimatePresence>
                            {stage === 'scanning' &&
                                <motion.div 
                                    initial={{ top: '0%' }} animate={{ top: '100%' }}
                                    transition={{ duration: 2, ease: 'linear' }}
                                    exit={{ opacity: 0 }}
                                    className="absolute left-0 w-full h-0.5 bg-brand-cyan/70 shadow-[0_0_10px_theme(colors.brand-cyan)]"
                                />
                            }
                            </AnimatePresence>
                            <pre className="whitespace-pre-wrap break-words"><code ref={codeRef}>
                                {code.map((line, i) => (
                                    <div key={i} className="overflow-hidden">
                                        <AnimatePresence initial={false}>
                                            {!(stage === 'applyingFix' || stage === 'closing' || stage === 'secure') || i !== vulnerableLineIndex ? (
                                                <motion.div
                                                    key="original"
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    animate={{
                                                        backgroundColor: stage === 'diagnosing' && i === vulnerableLineIndex ? 'rgba(255, 0, 0, 0.2)' : 'transparent',
                                                    }}
                                                    className="block"
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
        </section>
    );
};

export default CodeSurgeryAnimation;