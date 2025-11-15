import React, { useState, useMemo } from 'react';
import { DocsIcon } from './icons';

// Declare hljs for TypeScript since it's loaded from a script tag
declare global {
    interface Window {
        hljs: any;
    }
}

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
    const highlightedCode = useMemo(() => {
        if(window.hljs && code) {
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
        <pre className="bg-light-primary dark:bg-dark-primary p-4 rounded-md text-sm font-mono border border-gray-200 dark:border-white/10 overflow-x-auto">
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
    );
};

const Section: React.FC<{id: string, title: string, children: React.ReactNode}> = ({id, title, children}) => (
    <div id={id} className="py-4 scroll-mt-20"> {/* scroll-mt-20 to offset for sticky header */}
        <h2 className="text-2xl font-bold font-heading mb-4 text-dark-text dark:text-white">{title}</h2>
        <div className="space-y-4 text-medium-dark-text dark:text-medium-text">
            {children}
        </div>
    </div>
);

const DocsContent: React.FC = () => {
    const codeAnalysisSchema = `[
  {
    "line": 17,
    "severity": "Critical",
    "title": "SQL Injection",
    "description": "The application constructs an SQL query by directly embedding user-controlled input (product_id) into the SQL string...",
    "impact": "An attacker can manipulate the SQL query to bypass authentication, retrieve sensitive data from the database, or even execute system commands...",
    "suggestedFix": "product = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()"
  }
]`;

    const navItems = [
        { id: 'getting-started', title: 'Getting Started' },
        { id: 'github-pat', title: 'GitHub PAT Setup' },
        { id: 'notifications-setup', title: 'Notifications Setup' },
        { id: 'core-features', title: 'Core Features Guide' },
        { id: 'schemas', title: 'AI JSON Schemas' },
    ];

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    
    return (
        <div className="grid grid-cols-12 h-full">
            <aside className="col-span-3 border-r border-gray-200 dark:border-white/10 p-6 overflow-y-auto">
                <h3 className="text-lg font-bold font-heading mb-4 text-dark-text dark:text-white">User Guide</h3>
                <ul className="space-y-2">
                    {navItems.map(item => (
                        <li key={item.id}>
                            <a 
                                href={`#${item.id}`} 
                                onClick={(e) => handleNavClick(e, item.id)}
                                className="block text-sm text-medium-dark-text dark:text-medium-text hover:text-dark-text dark:hover:text-white transition-colors"
                            >
                                {item.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="col-span-9 p-8 overflow-y-auto">
                <Section id="getting-started" title="Getting Started">
                    <p>Welcome to Sentinel! To unlock the full power of AI-driven code analysis and GitHub integration, you need to provide two key credentials. Both are stored securely in your browser's local storage and are never sent to our servers.</p>
                </Section>
                <hr className="my-6 border-gray-200 dark:border-white/10" />

                 <Section id="github-pat" title="GitHub PAT Setup (Crucial Step)">
                    <p>A Personal Access Token is required for all features that interact with the GitHub API. An incorrect token is the most common source of errors.</p>
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-500 rounded-r-lg">
                        <p className="font-bold text-yellow-800 dark:text-yellow-200">Important: Use a "Classic" Token</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">GitHub's newer "Fine-Grained" tokens are complex and easily misconfigured. For the best experience with Sentinel, we strongly recommend creating a <strong className="font-semibold">Classic</strong> token.</p>
                    </div>
                    <h4 className="text-lg font-bold font-heading text-dark-text dark:text-white mt-4">Step-by-Step Guide:</h4>
                    <ol className="list-decimal pl-6 space-y-2">
                        <li>Navigate to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline">github.com/settings/tokens</a>.</li>
                        <li>Click <strong className="text-dark-text dark:text-white">"Generate new token"</strong> and select <strong className="text-dark-text dark:text-white">"Generate new token (classic)"</strong> from the dropdown.</li>
                        <li>Give your token a descriptive name (e.g., "Sentinel-AI-App").</li>
                        <li>Set an expiration date. 30 or 90 days is recommended.</li>
                        <li>In the <strong className="text-dark-text dark:text-white">"Select scopes"</strong> section, check the boxes for the full <code className="bg-gray-200 dark:bg-black/30 px-1.5 py-0.5 rounded-md font-mono text-sm">repo</code> scope and the <code className="bg-gray-200 dark:bg-black/30 px-1.5 py-0.5 rounded-md font-mono text-sm">security_events</code> scope. These grant the permissions Sentinel needs for repository interaction and security scanning.</li>
                        <li>Scroll to the bottom and click <strong className="text-dark-text dark:text-white">"Generate token"</strong>.</li>
                        <li>Copy the generated token (it starts with <code className="font-mono text-sm">ghp_</code>) immediately. You won't be able to see it again.</li>
                        <li>In Sentinel, go to the <strong className="text-dark-text dark:text-white">Settings</strong> page and paste the token into the "GitHub Personal Access Token" field.</li>
                    </ol>
                     <h4 className="text-lg font-bold font-heading text-dark-text dark:text-white mt-6">2. Gemini API Key</h4>
                    <p>This key is required for all AI-powered analysis features. Sentinel uses the Google Gemini family of models.</p>
                    <ul className="list-disc pl-6 space-y-1">
                         <li>Go to the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline">Google AI Studio</a> to get your API key.</li>
                        <li>Copy the key and paste it into the "Gemini API Key" field in Sentinel's Settings.</li>
                    </ul>
                </Section>
                 <hr className="my-6 border-gray-200 dark:border-white/10" />
                 
                <Section id="notifications-setup" title="Notifications Setup">
                    <p>The notifications feature runs on a small local server to handle sending emails or Slack messages. To use live notifications, you must run this server.</p>
                    <h4 className="text-lg font-bold font-heading text-dark-text dark:text-white mt-4">Running the Bot Server:</h4>
                    <ol className="list-decimal pl-6 space-y-2">
                        <li>Open a new terminal window.</li>
                        <li>Navigate to the <code className="font-mono text-sm">/bot</code> directory within the project folder.</li>
                        <li>Run the command <CodeBlock code="npm install" language="bash" /></li>
                        <li>Run the command <CodeBlock code="npm start" language="bash" /></li>
                    </ol>
                    <p>The server will start on port 3001. The Notifications dashboard will now show a "Live" or "Simulation" status instead of "Disconnected." To send real emails, you must also configure SMTP variables in a <code className="font-mono text-sm">.env</code> file inside the <code className="font-mono text-sm">/bot</code> directory, as instructed in the server's console output.</p>
                </Section>
                 <hr className="my-6 border-gray-200 dark:border-white/10" />

                 <Section id="core-features" title="Core Features Guide">
                    <h4 className="text-lg font-bold font-heading text-dark-text dark:text-white mt-4">Studio Sandbox</h4>
                    <p>The Studio is a sandbox environment for quick analysis. You can either paste a code snippet directly or use one of the provided samples to see Sentinel's analysis in action. The three-panel view shows your input, the code, and the found issues side-by-side.</p>
                    <h4 className="text-lg font-bold font-heading text-dark-text dark:text-white mt-4">GitOps Integration</h4>
                    <p>This powerful tool allows you to scan an entire GitHub repository. Simply enter a repository URL to fetch its file tree. You can then select individual files to analyze. If Sentinel finds a vulnerability, you can apply the AI-suggested fix directly in the UI and then create a Pull Request with that fix with a single click.</p>
                     <h4 className="text-lg font-bold font-heading text-dark-text dark:text-white mt-4">Commit History Scanner</h4>
                    <p>This feature scans the last 100 commits of a repository, using AI to look for red flags in commit messages that might indicate exposed secrets (e.g., "add api key") or other high-risk changes. It provides a quick way to audit recent activity for potential security oversights.</p>
                </Section>
                <hr className="my-6 border-gray-200 dark:border-white/10" />

                 <Section id="schemas" title="AI JSON Schemas">
                    <p>To ensure consistent and parsable results, Sentinel instructs the Gemini model to respond with a specific JSON structure for different analysis tasks. Understanding these schemas can help you interpret the results and customize the AI's system prompt in Settings.</p>
                    <h4 className="text-lg font-bold font-heading text-dark-text dark:text-white mt-4">Code Analysis Schema</h4>
                    <p>Used by the Studio and GitOps Integration tools when scanning a single file. Expect an array of objects matching this schema.</p>
                    <CodeBlock code={codeAnalysisSchema} language="json" />
                </Section>
            </main>
        </div>
    );
};

const DocumentationDashboard: React.FC = () => {
    return (
        <div className="h-full w-full flex flex-col glass-effect rounded-lg overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center space-x-3">
                <DocsIcon className="w-6 h-6 text-brand-purple" />
                 <h1 className="text-2xl font-bold text-dark-text dark:text-white font-heading">User Guide & Docs</h1>
            </div>
            <div className="flex-grow overflow-hidden">
                <DocsContent />
            </div>
        </div>
    );
};

export default DocumentationDashboard;