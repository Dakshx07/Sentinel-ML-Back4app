import React from 'react';
import { AppView, DashboardView } from '../types';
import { GithubIcon, SentinelLogoIcon } from './icons';
import HeroAnimation from './HeroAnimation';
import AnimatedFeatureShowcase from './AnimatedFeatureShowcase';
import InteractiveDemo from './InteractiveDemo';
// FIX: Correctly type framer-motion variants to resolve a TypeScript error.
import { motion, Variants } from 'framer-motion';
import CodeSurgeryAnimation from './CodeSurgeryAnimation';

const useAnimateOnScroll = (options?: IntersectionObserverInit) => {
    const ref = React.useRef<HTMLElement>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, ...options });

        const currentRef = ref.current;
        if (currentRef) {
            const elements = currentRef.querySelectorAll('.scroll-animate');
            elements.forEach(el => observer.observe(el));
        }

        return () => {
            if (currentRef) {
                const elements = currentRef.querySelectorAll('.scroll-animate');
                elements.forEach(el => observer.unobserve(el));
            }
        };
    }, [options]);

    return ref;
};

const HeroSection: React.FC<{ onNavigate: (view: DashboardView) => void }> = ({ onNavigate }) => (
    <section className="relative min-h-screen flex items-center justify-center text-center px-6 overflow-hidden bg-light-primary dark:bg-dark-primary">
        <HeroAnimation />
        <div className="absolute inset-0 bg-gradient-to-t from-light-primary dark:from-dark-primary via-light-primary/50 dark:via-dark-primary/50 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-dark-text dark:text-white font-heading uppercase tracking-wider animate-fade-in-up">
                Your Digital <span className="gradient-text">Fortress</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-medium-dark-text dark:text-medium-text animate-fade-in-up" style={{ animationDelay: '200ms', lineHeight: 1.7 }}>
                Sentinel transforms your codebase with AI-driven security, identifying complex vulnerabilities before they ever reach production.
            </p>
            <div className="mt-10 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <button
                    onClick={() => onNavigate('repositories')}
                    className="btn-primary py-4 px-10 text-xl"
                >
                    Explore The Dashboard
                </button>
            </div>
        </div>
    </section>
);

const FinalCTASection: React.FC<{ onNavigate: (view: DashboardView) => void }> = ({ onNavigate }) => {
    const sectionRef = useAnimateOnScroll();
    const liveFeedItems = [
        { type: 'CRITICAL', text: 'SQL Injection found in `api/v1/users.py`' },
        { type: 'SECURED', text: 'XSS vulnerability patched in `components/Comment.js`' },
        { type: 'HIGH', text: 'Hardcoded secret detected in `deploy/prod.tf`' },
        { type: 'SECURED', text: 'Insecure Direct Object Reference fixed in `controllers/documents.go`' },
        { type: 'CRITICAL', text: 'Remote Code Execution possible in `ImageUpload.java`' },
    ];

    const getPillColor = (type: string) => {
        if (type === 'CRITICAL' || type === 'HIGH') return 'bg-red-500/20 text-red-400';
        if (type === 'SECURED') return 'bg-green-500/20 text-green-400';
        return 'bg-yellow-500/20 text-yellow-400';
    };

    const marqueeVariants: Variants = {
        animate: {
            x: [0, '-100%'],
            transition: {
                x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 25,
                    ease: "linear",
                },
            },
        },
    };

    return (
        <section ref={sectionRef} className="py-24 bg-light-primary dark:bg-dark-primary overflow-hidden">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-dark-text dark:text-white font-heading mb-6 scroll-animate">
                    Activate Your Fortress
                </h2>
                <p className="text-lg text-medium-dark-text dark:text-medium-text mb-12 scroll-animate" style={{ transitionDelay: '150ms' }}>
                    Don't wait for the next vulnerability. See Sentinel in action and take control of your code's security today.
                </p>
                <div className="relative h-14 w-full scroll-animate marquee-container" style={{ transitionDelay: '300ms' }}>
                    <motion.div className="flex" variants={marqueeVariants} animate="animate">
                        {[...liveFeedItems, ...liveFeedItems].map((item, index) => (
                            <div key={index} className="flex items-center space-x-3 bg-light-secondary dark:bg-dark-secondary rounded-full py-2 px-4 mx-2 flex-shrink-0">
                                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${getPillColor(item.type)}`}>{item.type}</span>
                                <span className="text-sm font-mono text-medium-dark-text dark:text-medium-text">{item.text}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
                <div className="mt-12 scroll-animate" style={{ transitionDelay: '450ms' }}>
                    <button onClick={() => onNavigate('repositories')} className="btn-primary py-4 px-10 text-xl">
                        Get Started for Free
                    </button>
                </div>
            </div>
        </section>
    );
}

const LandingPage: React.FC<{ onNavigate: (view: AppView | DashboardView) => void }> = ({ onNavigate }) => {
    const footerRef = useAnimateOnScroll();
    return (
        <>
            <main className="overflow-x-hidden font-sans bg-light-primary dark:bg-dark-primary">
                <HeroSection onNavigate={onNavigate} />

                <section id="features" className="py-24 bg-light-primary dark:bg-dark-primary">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-dark-text dark:text-white font-heading mb-4 scroll-animate">
                            Security, Supercharged.
                        </h2>
                        <p className="max-w-3xl mx-auto text-lg text-medium-dark-text dark:text-medium-text mb-20 scroll-animate" style={{ transitionDelay: '150ms' }}>
                            Sentinel integrates seamlessly into your workflow, providing a suite of powerful tools to automate and elevate your code security practices.
                        </p>
                        <AnimatedFeatureShowcase />
                    </div>
                </section>

                <section id="why-sentinel" className="py-24 bg-light-secondary dark:bg-dark-secondary">
                    <InteractiveDemo />
                </section>

                <CodeSurgeryAnimation />

                <FinalCTASection onNavigate={onNavigate} />
            </main>
            <footer ref={footerRef} className="bg-light-secondary dark:bg-dark-secondary text-medium-dark-text dark:text-medium-text border-t border-gray-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left scroll-animate">
                            <div className="flex items-center justify-center md:justify-start space-x-3">
                                <SentinelLogoIcon className="w-8 h-auto text-dark-text dark:text-white" />
                                <span className="font-bold text-xl font-heading text-dark-text dark:text-white">Sentinel AI</span>
                            </div>
                            <p className="mt-4 text-sm max-w-xs mx-auto md:mx-0">The code-aware AI security agent for modern development teams.</p>
                            <div className="mt-4 flex items-center justify-center md:justify-start space-x-4">
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-cyan transition-colors"><GithubIcon className="w-5 h-5" /></a>
                            </div>
                        </div>
                        <div className="flex items-center space-x-8 scroll-animate" style={{ transitionDelay: '150ms' }}>
                            <a href="#features" className="hover:text-brand-cyan transition-colors text-sm font-medium">Features</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }} className="hover:text-brand-cyan transition-colors text-sm font-medium">Pricing</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }} className="hover:text-brand-cyan transition-colors text-sm font-medium">Dashboard</a>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10 text-center text-xs">
                        <p>&copy; {new Date().getFullYear()} Sentinel AI. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default LandingPage;