import React, { useState, useMemo } from 'react';
import { DocsIcon, DoubleArrowRightIcon, DoubleArrowLeftIcon, BookOpenIcon, CodeIcon, ShieldIcon, BellIcon, GithubIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

// Declare hljs for TypeScript since it's loaded from a script tag
declare global {
    interface Window {
        hljs: any;
    }
}

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
    const highlightedCode = useMemo(() => {
        if (window.hljs && code) {
            try {
                return window.hljs.highlight(code, { language, ignoreIllegals: true }).value;
            } catch (e) {
                console.error("Highlight.js error:", e);
                return code; // Fallback
            }
        }
        return code;
    }, [code, language]);

    return (
        <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/50 shadow-inner my-4">
            <div className="absolute top-0 left-0 right-0 h-8 bg-white/5 border-b border-white/5 flex items-center px-4">
                <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <span className="ml-4 text-[10px] text-gray-500 font-mono uppercase">{language}</span>
            </div>
            <pre className="p-4 pt-12 overflow-x-auto text-xs font-mono leading-relaxed custom-scrollbar">
                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} className="text-gray-300" />
            </pre>
        </div>
    );
};

const Section: React.FC<{ id: string, title: string, icon?: React.ReactNode, children: React.ReactNode }> = ({ id, title, icon, children }) => (
    <motion.div
        id={id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="py-8 scroll-mt-24 border-b border-white/5 last:border-0"
    >
        <div className="flex items-center space-x-3 mb-6">
            {icon && <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-brand-purple">{icon}</div>}
            <h2 className="text-2xl font-bold font-heading text-white tracking-tight">{title}</h2>
        </div>
        <div className="space-y-4 text-gray-400 leading-relaxed text-sm">
            {children}
        </div>
    </motion.div>
);

const DocsContent: React.FC = () => {
    const codeAnalysisSchema = `[
  {
    "line": 17,
    "severity": "Critical",
    "title": "SQL Injection",
    "description": "The application constructs an SQL query by directly embedding user-controlled input...",
    "impact": "An attacker can manipulate the SQL query to bypass authentication...",
    "suggestedFix": "product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()"
  }
]`;

    const navItems = [
        { id: 'getting-started', title: 'Getting Started', icon: <BookOpenIcon className="w-4 h-4" /> },
        { id: 'github-pat', title: 'GitHub PAT Setup', icon: <GithubIcon className="w-4 h-4" /> },
        { id: 'notifications-setup', title: 'Notifications Setup', icon: <BellIcon className="w-4 h-4" /> },
        { id: 'core-features', title: 'Core Features Guide', icon: <ShieldIcon className="w-4 h-4" /> },
        { id: 'schemas', title: 'AI JSON Schemas', icon: <CodeIcon className="w-4 h-4" /> },
    ];

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            <aside className="hidden lg:block lg:col-span-3 border-r border-white/5 p-6 overflow-y-auto custom-scrollbar bg-black/20">
                <h3 className="text-xs font-bold font-heading mb-6 text-gray-500 uppercase tracking-wider">Table of Contents</h3>
                <ul className="space-y-1">
                    {navItems.map(item => (
                        <li key={item.id}>
                            <a
                                href={`#${item.id}`}
                                onClick={(e) => handleNavClick(e, item.id)}
                                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                            >
                                <span className="text-gray-600 group-hover:text-brand-purple transition-colors">{item.icon}</span>
                                <span>{item.title}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="col-span-1 lg:col-span-9 p-8 overflow-y-auto custom-scrollbar scroll-smooth">
                <div className="max-w-4xl mx-auto">
                    <Section id="getting-started" title="Getting Started" icon={<BookOpenIcon className="w-6 h-6 text-blue-400" />}>
                        <p className="text-lg text-gray-300 mb-4">Welcome to Sentinel! To unlock the full power of AI-driven code analysis and GitHub integration, you need to provide two key credentials.</p>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start space-x-3">
                            <ShieldIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-blue-200 text-xs">Both credentials are stored securely in your browser's local storage and are never sent to our servers.</p>
                        </div>
                    </Section>

                    <Section id="github-pat" title="GitHub PAT Setup" icon={<GithubIcon className="w-6 h-6 text-purple-400" />}>
                        <p>A Personal Access Token is required for all features that interact with the GitHub API. An incorrect token is the most common source of errors.</p>

                        <div className="my-6 p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldIcon className="w-24 h-24 text-yellow-500" />
                            </div>
                            <h4 className="font-bold text-yellow-400 mb-2 flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                <span>Important: Use a "Classic" Token</span>
                            </h4>
                            <p className="text-sm text-yellow-200/80 relative z-10">GitHub's newer "Fine-Grained" tokens are complex and easily misconfigured. For the best experience with Sentinel, we strongly recommend creating a <strong className="text-yellow-200">Classic</strong> token.</p>
                        </div>

                        <h4 className="text-sm font-bold font-heading text-white mt-8 mb-4 uppercase tracking-wider">Step-by-Step Guide</h4>
                        <ol className="space-y-4 relative border-l border-white/10 ml-3 pl-8">
                            {[
                                <span>Navigate to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-brand-purple hover:text-brand-purple/80 underline decoration-brand-purple/30 underline-offset-4">github.com/settings/tokens</a>.</span>,
                                <span>Click <strong className="text-white">"Generate new token"</strong> and select <strong className="text-white">"Generate new token (classic)"</strong>.</span>,
                                <span>Give your token a descriptive name (e.g., "Sentinel-AI-App").</span>,
                                <span>Set an expiration date (30 or 90 days recommended).</span>,
                                <span>Check the boxes for <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-xs">repo</code> and <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-xs">security_events</code> scopes.</span>,
                                <span>Scroll to bottom and click <strong className="text-white">"Generate token"</strong>.</span>,
                                <span>Copy the token (starts with <code className="font-mono text-xs text-brand-purple">ghp_</code>) immediately.</span>,
                                <span>Paste into Sentinel's <strong className="text-white">Settings</strong> page.</span>
                            ].map((step, i) => (
                                <li key={i} className="relative">
                                    <span className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-black border border-white/20 flex items-center justify-center text-[10px] font-bold text-gray-500">{i + 1}</span>
                                    {step}
                                </li>
                            ))}
                        </ol>

                        <h4 className="text-sm font-bold font-heading text-white mt-8 mb-4 uppercase tracking-wider">Gemini API Key</h4>
                        <p>Required for all AI-powered analysis features. Sentinel uses the Google Gemini family of models.</p>
                        <ul className="mt-4 space-y-2">
                            <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                                <span>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-purple hover:underline">Google AI Studio</a> to get your API key.</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                                <span>Paste it into the "Gemini API Key" field in Sentinel's Settings.</span>
                            </li>
                        </ul>
                    </Section>

                    <Section id="notifications-setup" title="Notifications Setup" icon={<BellIcon className="w-6 h-6 text-emerald-400" />}>
                        <p>The notifications feature runs on a small local server to handle sending emails or Slack messages.</p>
                        <div className="mt-6 bg-black/50 border border-white/10 rounded-xl p-6">
                            <h4 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wider mb-4">Terminal Commands</h4>
                            <CodeBlock code="cd bot&#10;npm install&#10;npm start" language="bash" />
                        </div>
                        <p className="mt-4 text-xs text-gray-500">The server will start on port 3001. Configure SMTP variables in <code className="bg-white/10 px-1 py-0.5 rounded text-gray-300 font-mono">/bot/.env</code> to send real emails.</p>
                    </Section>

                    <Section id="core-features" title="Core Features Guide" icon={<ShieldIcon className="w-6 h-6 text-rose-400" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {[
                                { title: "Studio Sandbox", desc: "Quick analysis sandbox. Paste code snippets or use samples to see Sentinel's analysis in action side-by-side." },
                                { title: "GitOps Integration", desc: "Scan entire repositories. Fetch file trees, analyze files, apply AI fixes, and create Pull Requests in one flow." },
                                { title: "Commit Scanner", desc: "Audit recent commit history for red flags like exposed secrets or high-risk changes using AI analysis." }
                            ].map((feature, i) => (
                                <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 hover:bg-white/[0.07] transition-all">
                                    <h4 className="text-sm font-bold text-white mb-2">{feature.title}</h4>
                                    <p className="text-xs text-gray-400 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section id="schemas" title="AI JSON Schemas" icon={<CodeIcon className="w-6 h-6 text-cyan-400" />}>
                        <p>Sentinel instructs the Gemini model to respond with specific JSON structures. Understanding these schemas helps in customizing system prompts.</p>
                        <h4 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wider mt-6 mb-2">Code Analysis Schema</h4>
                        <CodeBlock code={codeAnalysisSchema} language="json" />
                    </Section>
                </div>
            </main>
        </div>
    );
};

const DocumentationDashboard: React.FC = () => {
    return (
        <div className="h-full w-full flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6 border-b border-white/5 flex items-center space-x-4 bg-black/20">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    <DocsIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white font-heading tracking-tight">User Guide & Docs</h1>
                    <p className="text-sm text-gray-400">Comprehensive documentation for Sentinel.</p>
                </div>
            </div>
            <div className="flex-grow overflow-hidden">
                <DocsContent />
            </div>
        </div>
    );
};

export default DocumentationDashboard;