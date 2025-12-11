import React, { useRef, useState, useEffect, Suspense, lazy } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import {
    Shield, Zap, Lock, Code2, Terminal, Cpu,
    ArrowRight, CheckCircle2, Github, ChevronRight, ChevronDown,
    Activity, Layers, Globe, Command, Sparkles,
    MousePointer2, Box, Brain, Settings
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AppView, DashboardView } from '../types';

// Lazy load ShaderAnimation to avoid blocking initial render
const ShaderAnimation = lazy(() => import('./ui/ShaderAnimation'));
const RevealText = lazy(() => import('./ui/RevealText'));
const ContainerScroll = lazy(() => import('./ui/ContainerScroll'));
const WebGLShader = lazy(() => import('./ui/WebGLShader'));

// --- Utility ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LandingPageProps {
    onNavigate: (view: AppView | DashboardView) => void;
}

// --- Components ---

const Logo = () => {
    return (
        <div className="relative group cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            {/* Subtle hover glow */}
            <div className="absolute -inset-2 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>

            <div className="relative flex items-center space-x-3">
                {/* Neural Network Icon - Matching reference image */}
                <div className="w-11 h-11 relative flex items-center justify-center bg-black border border-white/20 rounded-xl group-hover:border-white/40 transition-all duration-300">
                    {/* Outer rounded container hover effect */}
                    <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    {/* Neural network SVG - molecular structure */}
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {/* Central node */}
                        <circle cx="12" cy="12" r="2.5" fill="currentColor" strokeWidth="0" />

                        {/* Outer nodes - 4 corners */}
                        <circle cx="5" cy="7" r="1.5" fill="currentColor" strokeWidth="0" />
                        <circle cx="19" cy="7" r="1.5" fill="currentColor" strokeWidth="0" />
                        <circle cx="5" cy="17" r="1.5" fill="currentColor" strokeWidth="0" />
                        <circle cx="19" cy="17" r="1.5" fill="currentColor" strokeWidth="0" />

                        {/* Connection lines to center */}
                        <line x1="5" y1="7" x2="12" y2="12" strokeLinecap="round" />
                        <line x1="19" y1="7" x2="12" y2="12" strokeLinecap="round" />
                        <line x1="5" y1="17" x2="12" y2="12" strokeLinecap="round" />
                        <line x1="19" y1="17" x2="12" y2="12" strokeLinecap="round" />

                        {/* Cross connections */}
                        <line x1="5" y1="7" x2="19" y2="17" strokeLinecap="round" className="opacity-30" />
                        <line x1="19" y1="7" x2="5" y2="17" strokeLinecap="round" className="opacity-30" />
                    </svg>
                </div>

                {/* Brand Name */}
                <span className="text-xl font-bold font-heading tracking-tight text-white uppercase">
                    Sentinel
                </span>
            </div>
        </div>
    );
};

// Unique nav link with split letter hover effect
const NavLink = ({ href, children }: { href: string; children: string }) => (
    <a
        href={href}
        className="relative px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-300 group"
    >
        {/* Split letters that stagger on hover */}
        <span className="relative inline-flex overflow-hidden">
            {children.split('').map((char, i) => (
                <span
                    key={i}
                    className="inline-block group-hover:-translate-y-full transition-transform duration-300"
                    style={{ transitionDelay: `${i * 20}ms` }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </span>
        <span className="absolute top-0 left-4 inline-flex overflow-hidden">
            {children.split('').map((char, i) => (
                <span
                    key={i}
                    className="inline-block translate-y-full group-hover:translate-y-0 text-white transition-transform duration-300"
                    style={{ transitionDelay: `${i * 20}ms` }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </span>

        {/* Underline that grows from left */}
        <span className="absolute bottom-1 left-4 right-4 h-[1px] bg-white/50 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
    </a>
);

const Navbar = ({ onNavigate }: { onNavigate: any }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
        >
            <div className={cn(
                "flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 w-full max-w-5xl",
                scrolled ? "bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50" : "bg-transparent border border-transparent"
            )}>
                <Logo />

                <div className="hidden md:flex items-center space-x-2">
                    <NavLink href="#features">Features</NavLink>
                    <NavLink href="#how-it-works">How it Works</NavLink>
                    <NavLink href="#testimonials">Testimonials</NavLink>
                    <NavLink href="#pricing">Pricing</NavLink>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Sign In - Underline reveal */}
                    <button
                        onClick={() => onNavigate('auth')}
                        className="hidden md:block relative text-sm font-medium text-gray-300 hover:text-white transition-colors group overflow-hidden py-2"
                    >
                        <span className="relative z-10">Sign In</span>
                        <span className="absolute bottom-1 left-0 w-full h-[1px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </button>

                    {/* Get Started - Liquid fill button */}
                    <button
                        onClick={() => onNavigate('auth')}
                        className="group relative px-6 py-2.5 bg-white text-black text-sm font-bold rounded-full overflow-hidden"
                    >
                        {/* Liquid blob background */}
                        <span className="absolute inset-0 bg-white"></span>
                        <span className="absolute top-full left-1/2 -translate-x-1/2 w-[200%] aspect-square bg-black rounded-[40%] group-hover:top-[-50%] transition-all duration-700 ease-out"></span>

                        {/* Text */}
                        <span className="relative z-10 group-hover:text-white transition-colors duration-300 delay-100">Get Started</span>

                        {/* Arrow that appears */}
                        <ArrowRight className="relative z-10 inline-block w-0 h-4 ml-0 opacity-0 group-hover:w-4 group-hover:ml-2 group-hover:opacity-100 transition-all duration-300 group-hover:text-white" />
                    </button>
                </div>
            </div>
        </motion.nav>
    );
};


const Hero = ({ onNavigate }: { onNavigate: any }) => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 80]);
    const y2 = useTransform(scrollY, [0, 500], [0, -80]);
    const y3 = useTransform(scrollY, [0, 500], [0, 60]);
    const y4 = useTransform(scrollY, [0, 500], [0, -60]);
    const opacity = useTransform(scrollY, [0, 400], [1, 0]);
    const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

    // Mouse position for button magnetic effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden pb-32">
            {/* Shader Animation Background */}
            <div className="absolute inset-0 z-0">
                <Suspense fallback={<div className="absolute inset-0 bg-[#020202]" />}>
                    <ShaderAnimation />
                </Suspense>
                {/* Overlay to soften the shader and ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
                {/* Additional vignette for focus */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/70 pointer-events-none" style={{
                    background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)'
                }} />
            </div>

            {/* Main Content */}
            <motion.div
                style={{ scale, opacity }}
                className="relative z-10 max-w-6xl mx-auto text-center pt-32"
            >
                {/* Status Pill */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center space-x-3 bg-gradient-to-r from-white/[0.08] to-white/[0.03] border border-white/10 rounded-full px-5 py-2.5 mb-12 backdrop-blur-sm cursor-default group hover:border-white/20 hover:bg-white/[0.05] transition-all duration-500"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-gray-300 tracking-wider uppercase font-mono">Sentinel v2.0 • Now Live</span>
                </motion.div>

                {/* Main Heading - Unique Stacked Layout */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative mb-12"
                >
                    <h1 className="text-[12vw] md:text-[10vw] lg:text-[140px] font-black font-heading tracking-[-0.04em] leading-[0.85] uppercase">
                        <span className="block text-transparent bg-clip-text bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 hover:from-gray-500 hover:to-gray-700 transition-all duration-700 cursor-default">
                            Secure
                        </span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400 drop-shadow-[0_0_80px_rgba(255,255,255,0.15)]">
                            Your Code
                        </span>
                    </h1>

                    {/* Decorative underline gradient */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </motion.div>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="text-lg md:text-xl lg:text-2xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed font-light tracking-wide"
                >
                    The <span className="text-white font-medium">AI-powered</span> security architect that lives in your codebase.
                    <span className="text-gray-500"> Detects. Fixes. Hardens. Automatically.</span>
                </motion.p>

                {/* CTA Buttons - Clean unique hovers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    {/* Primary Button - Gradient shine sweep */}
                    <motion.button
                        onClick={() => onNavigate('auth')}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="group relative px-10 py-5 bg-white text-black font-bold text-lg rounded-full overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-all duration-500"
                    >
                        {/* Gradient shine sweep on hover */}
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></span>

                        {/* Top edge highlight */}
                        <span className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></span>

                        <span className="relative z-10 flex items-center font-heading tracking-wide">
                            Start Protecting
                            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                        </span>
                    </motion.button>

                    {/* Secondary Button - Border glow + icon animation */}
                    <motion.button
                        onClick={() => onNavigate('repositories')}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="group relative px-10 py-5 text-white font-bold text-lg rounded-full border border-white/20 hover:border-white/40 hover:bg-white/[0.03] transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                        <span className="relative z-10 flex items-center font-heading tracking-wide">
                            <Terminal className="w-5 h-5 mr-3 text-gray-500 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                            Watch Demo
                        </span>
                    </motion.button>
                </motion.div>

                {/* Tech Stack Badge - Positioned below buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="mt-10 flex items-center justify-center"
                >
                    <div className="inline-flex items-center space-x-4 px-5 py-2.5 bg-white/[0.03] border border-white/10 rounded-full backdrop-blur-sm">
                        <span className="text-[10px] text-gray-600 uppercase tracking-widest">Supports</span>
                        <div className="flex items-center space-x-3">
                            {['Python', 'TypeScript', 'Go', 'Rust'].map((lang) => (
                                <span key={lang} className="text-xs text-gray-400 font-mono hover:text-white transition-colors duration-200 cursor-default">
                                    {lang}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Floating Tool Widgets - Autonomous floating + cursor interaction */}

            {/* Widget 1: Vulnerability Alert - Top Left */}
            <motion.div
                style={{ y: y1, opacity }}
                initial={{ opacity: 0, x: -50 }}
                animate={{
                    opacity: 1,
                    x: 0,
                    y: [0, -8, 0],
                    rotate: [-3, -1, -3]
                }}
                transition={{
                    opacity: { duration: 0.8, delay: 1 },
                    x: { duration: 0.8, delay: 1 },
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                }}
                whileHover={{ scale: 1.02, rotate: 0 }}
                className="absolute top-[18%] left-[4%] hidden xl:block z-20 cursor-default"
            >
                <div className="bg-black/70 backdrop-blur-2xl border border-white/[0.08] p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] w-72 group hover:border-white/20 transition-all duration-500">
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Critical Alert</span>
                    </div>
                    <p className="text-sm text-gray-400 font-mono mb-2">SQL Injection in <span className="text-white font-medium">auth.ts:142</span></p>
                    <div className="mt-3 text-xs text-green-400 flex items-center bg-green-500/10 px-3 py-1.5 rounded-lg w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Auto-patched
                    </div>
                </div>
            </motion.div>

            {/* Widget 2: Code Snippet - Top Right */}
            <motion.div
                style={{ y: y2, opacity }}
                initial={{ opacity: 0, x: 50 }}
                animate={{
                    opacity: 1,
                    x: 0,
                    y: [0, 10, 0],
                    rotate: [4, 2, 4]
                }}
                transition={{
                    opacity: { duration: 0.8, delay: 1.2 },
                    x: { duration: 0.8, delay: 1.2 },
                    y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                }}
                whileHover={{ scale: 1.02, rotate: 0 }}
                className="absolute top-[20%] right-[4%] hidden xl:block z-20 cursor-default"
            >
                <div className="bg-black/70 backdrop-blur-2xl border border-white/[0.08] p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] w-64 group hover:border-white/20 transition-all duration-500">
                    <div className="flex items-center space-x-1.5 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                        <span className="text-[10px] text-gray-600 font-mono ml-2">fix.diff</span>
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                        <div className="text-gray-600">// Before</div>
                        <div className="text-red-400/80 line-through pl-2">query(userInput)</div>
                        <div className="text-gray-600 mt-1">// After</div>
                        <div className="text-green-400 pl-2">query(sanitize(userInput))</div>
                    </div>
                </div>
            </motion.div>

            {/* Widget 3: Security Score - Bottom Left */}
            <motion.div
                style={{ y: y3, opacity }}
                initial={{ opacity: 0, x: -50 }}
                animate={{
                    opacity: 1,
                    x: 0,
                    y: [0, 6, 0],
                    rotate: [2, 0, 2]
                }}
                transition={{
                    opacity: { duration: 0.8, delay: 1.4 },
                    x: { duration: 0.8, delay: 1.4 },
                    y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
                }}
                whileHover={{ scale: 1.02, rotate: 0 }}
                className="absolute bottom-[28%] left-[6%] hidden xl:block z-20 cursor-default"
            >
                <div className="bg-black/70 backdrop-blur-2xl border border-white/[0.08] p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] w-52 group hover:border-white/20 transition-all duration-500">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Security Score</span>
                        <span className="text-3xl font-black text-white font-mono">A+</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "98%" }}
                            transition={{ duration: 1.5, delay: 2, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600 mt-2 font-mono">
                        <span>SOC2</span>
                        <span>HIPAA</span>
                        <span>GDPR</span>
                    </div>
                </div>
            </motion.div>

            {/* Widget 4: Real-time Status - Bottom Right */}
            <motion.div
                style={{ y: y4, opacity }}
                initial={{ opacity: 0, x: 50 }}
                animate={{
                    opacity: 1,
                    x: 0,
                    y: [0, -7, 0],
                    rotate: [-4, -2, -4]
                }}
                transition={{
                    opacity: { duration: 0.8, delay: 1.6 },
                    x: { duration: 0.8, delay: 1.6 },
                    y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 6.5, repeat: Infinity, ease: "easeInOut" }
                }}
                whileHover={{ scale: 1.02, rotate: 0 }}
                className="absolute bottom-[24%] right-[4%] hidden xl:block z-20 cursor-default"
            >
                <div className="bg-black/70 backdrop-blur-2xl border border-white/[0.08] p-5 rounded-2xl shadow-[0_25px_80px_rgba(0,0,0,0.6)] w-56 group hover:border-white/20 transition-all duration-500">
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Scan</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Files scanned</span>
                            <span className="text-white font-mono font-medium">1,247</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Issues found</span>
                            <span className="text-yellow-400 font-mono font-medium">23</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Auto-fixed</span>
                            <span className="text-green-400 font-mono font-medium">23 ✓</span>
                        </div>
                    </div>
                </div>
            </motion.div>


            {/* Scroll Indicator - Fixed positioning */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-30"
            >
                <span className="text-[10px] text-gray-600 uppercase tracking-widest mb-3 font-mono">Scroll</span>
                <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-1.5 hover:border-white/40 transition-colors duration-300">
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        className="w-1.5 h-3 bg-white/60 rounded-full"
                    />
                </div>
            </motion.div>
        </section>
    );
};



const Marquee = () => {
    return (
        <div className="py-12 bg-black border-y border-white/5 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10"></div>

            <motion.div
                className="flex space-x-24 min-w-max"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
            >
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex space-x-24 items-center opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                        {['ACME Corp', 'Nebula', 'Vertex', 'CyberDyne', 'Massive', 'Global', 'TechFlow', 'SecureNet'].map((logo, j) => (
                            <span key={j} className="text-2xl font-bold font-heading text-white hover:text-indigo-400 transition-colors cursor-default">{logo}</span>
                        ))}
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

// Tech Stack Infinite Scroller - Project Technologies
const TechStackScroller = () => {
    const techStack = [
        { name: 'React', color: 'from-cyan-400 to-blue-500' },
        { name: 'TypeScript', color: 'from-blue-400 to-blue-600' },
        { name: 'Vite', color: 'from-purple-400 to-yellow-400' },
        { name: 'Tailwind CSS', color: 'from-cyan-400 to-teal-500' },
        { name: 'Framer Motion', color: 'from-pink-400 to-purple-500' },
        { name: 'Back4App', color: 'from-blue-400 to-indigo-500' },
        { name: 'Gemini AI', color: 'from-blue-500 to-purple-600' },
        { name: 'GitHub API', color: 'from-gray-400 to-gray-600' },
        { name: 'Lucide Icons', color: 'from-orange-400 to-red-400' },
        { name: 'Lenis', color: 'from-green-400 to-emerald-500' },
        { name: 'Parse SDK', color: 'from-blue-400 to-cyan-400' },
        { name: 'Python', color: 'from-yellow-400 to-green-500' },
        { name: 'Node.js', color: 'from-green-400 to-emerald-600' },
        { name: 'Machine Learning', color: 'from-purple-500 to-pink-500' },
    ];

    return (
        <section className="py-20 bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10 pointer-events-none"></div>

            <div className="text-center mb-12 relative z-20">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Built With</p>
                <h3 className="text-2xl md:text-3xl font-bold text-white font-heading">Our Tech Stack</h3>
            </div>

            {/* First row - scrolling left */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10"></div>
                <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10"></div>
                <motion.div
                    className="flex space-x-6"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
                >
                    {[...techStack, ...techStack].map((tech, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.05, y: -3 }}
                            className="flex-shrink-0 px-6 py-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-white/30 hover:bg-white/10 transition-all duration-300 group cursor-default"
                        >
                            <span className={`text-base font-bold bg-gradient-to-r ${tech.color} bg-clip-text text-transparent group-hover:opacity-100 opacity-70 transition-opacity`}>
                                {tech.name}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Second row - scrolling right */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10"></div>
                <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10"></div>
                <motion.div
                    className="flex space-x-6"
                    animate={{ x: ["-50%", "0%"] }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 35 }}
                >
                    {[...techStack, ...techStack].reverse().map((tech, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.05, y: -3 }}
                            className="flex-shrink-0 px-6 py-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-white/30 hover:bg-white/10 transition-all duration-300 group cursor-default"
                        >
                            <span className={`text-base font-bold bg-gradient-to-r ${tech.color} bg-clip-text text-transparent group-hover:opacity-100 opacity-70 transition-opacity`}>
                                {tech.name}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

const TiltCard = ({ title, desc, icon: Icon, className, delay = 0 }: { title: string, desc: string, icon: any, className?: string, delay?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left - width / 2);
        y.set(clientY - top - height / 2);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            ref={ref}
            onMouseMove={onMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            style={{ rotateX: useTransform(mouseY, [-200, 200], [5, -5]), rotateY: useTransform(mouseX, [-200, 200], [-5, 5]), transformStyle: "preserve-3d" }}
            className={cn("relative h-full rounded-3xl bg-[#0A0A0A] border border-white/5 p-8 overflow-hidden group hover:border-white/20 transition-colors duration-500", className)}
        >
            <div style={{ transform: "translateZ(50px)" }} className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300 border border-white/10 group-hover:bg-white text-white group-hover:text-black">
                    <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 font-heading">{title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
            </div>

            {/* Glow Effect */}
            <motion.div
                style={{
                    background: useMotionTemplate`radial-gradient(500px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.05), transparent 80%)`,
                }}
                className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
        </motion.div>
    );
};

// Features Section - Unique Bento Grid with View All
const Features = () => {
    const [showAll, setShowAll] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ['50px', '-50px']);

    const features = [
        {
            title: "Real-Time Analysis",
            desc: "AI scans your code as you type, identifying vulnerabilities instantly.",
            icon: Activity,
            stat: "450ms",
            statLabel: "Avg. Scan",
            large: true,
        },
        {
            title: "Auto-Remediation",
            desc: "One-click production-ready patches.",
            icon: Zap,
            stat: "98%",
            statLabel: "Fix Rate",
        },
        {
            title: "GitOps Native",
            desc: "Blocks insecure PRs before merge.",
            icon: Github,
            stat: "24/7",
            statLabel: "Protection",
        },
        {
            title: "Secret Detection",
            desc: "Prevents API keys from leaking.",
            icon: Lock,
            stat: "99.9%",
            statLabel: "Accuracy",
        },
        {
            title: "Full Compliance",
            desc: "SOC2, HIPAA, GDPR built-in.",
            icon: Globe,
            stat: "15+",
            statLabel: "Frameworks",
        },
    ];

    const additionalFeatures = [
        { title: "Code Review AI", desc: "Intelligent suggestions for best practices.", icon: Brain },
        { title: "Dependency Scanning", desc: "Monitor vulnerable dependencies.", icon: Layers },
        { title: "API Security", desc: "Automated API testing.", icon: Terminal },
        { title: "Custom Rules", desc: "Create rules for your team.", icon: Settings },
    ];

    return (
        <section ref={sectionRef} id="features" className="py-32 px-6 bg-black relative overflow-hidden">
            {/* Background grid pattern */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                backgroundSize: '60px 60px'
            }}></div>

            <motion.div style={{ y }} className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end"
                >
                    <div>
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6"
                        >
                            <Shield className="w-6 h-6 text-white" />
                        </motion.div>
                        <h2 className="text-5xl md:text-6xl font-black text-white font-heading tracking-tight mb-4">
                            <span className="text-white/40">THE SENTINEL</span>
                            <br />
                            <span>ADVANTAGE</span>
                        </h2>
                        <p className="text-gray-500 text-lg max-w-md">
                            Enterprise-grade security that developers actually love.
                        </p>
                    </div>
                    <motion.button
                        onClick={() => setShowAll(!showAll)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-6 md:mt-0 group flex items-center space-x-2 px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all duration-300 text-sm font-semibold"
                    >
                        <span>{showAll ? 'Show Less' : 'View All Features'}</span>
                        <motion.span animate={{ rotate: showAll ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronDown className="w-4 h-4" />
                        </motion.span>
                    </motion.button>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.08, duration: 0.5 }}
                            whileHover={{
                                y: -8,
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                            className={`group relative cursor-pointer ${feature.large ? 'lg:col-span-2 lg:row-span-1' : ''}`}
                        >
                            {/* Animated border glow on hover */}
                            <div className="absolute -inset-[1px] bg-gradient-to-r from-white/20 via-white/40 to-white/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500"></div>

                            <div className="relative h-full bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 group-hover:border-white/30 transition-all duration-300 overflow-hidden">
                                {/* Sweeping light effect on hover */}
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                                {/* Subtle corner glow on hover */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                <div className="flex items-start justify-between mb-4 relative">
                                    {/* Icon with rotation and scale on hover */}
                                    <motion.div
                                        className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-300"
                                        whileHover={{ rotate: 10, scale: 1.1 }}
                                    >
                                        <feature.icon className="w-5 h-5 text-white group-hover:text-black transition-colors duration-300" />
                                    </motion.div>
                                    {/* Stat with pulse effect on card hover */}
                                    <motion.div
                                        className="text-right"
                                        initial={{ scale: 1 }}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <motion.span
                                            className="text-2xl font-black text-white block"
                                            animate={{
                                                textShadow: ["0 0 0 transparent", "0 0 10px rgba(255,255,255,0.3)", "0 0 0 transparent"]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                        >
                                            {feature.stat}
                                        </motion.span>
                                        <span className="block text-xs text-gray-600">{feature.statLabel}</span>
                                    </motion.div>
                                </div>

                                {/* Title with animated underline on hover */}
                                <h3 className="text-xl font-bold text-white mb-2 font-heading relative inline-block">
                                    {feature.title}
                                    <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-white group-hover:w-full transition-all duration-300"></span>
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-400 transition-colors duration-300">
                                    {feature.desc}
                                </p>

                                {/* Arrow that slides in on hover */}
                                <motion.div
                                    className="absolute bottom-6 right-6"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileHover={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Additional Features - Expandable */}
                <AnimatePresence>
                    {showAll && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden mt-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {additionalFeatures.map((feature, i) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        whileHover={{
                                            y: -6,
                                            transition: { duration: 0.3, ease: "easeOut" }
                                        }}
                                        className="group relative cursor-pointer"
                                    >
                                        {/* Animated border glow on hover */}
                                        <div className="absolute -inset-[1px] bg-gradient-to-r from-white/20 via-white/40 to-white/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500"></div>

                                        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl p-5 group-hover:border-white/30 transition-all duration-300 overflow-hidden">
                                            {/* Sweeping light effect on hover */}
                                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                                            {/* Icon with rotation on hover */}
                                            <motion.div
                                                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white transition-all duration-300"
                                                whileHover={{ rotate: 10, scale: 1.1 }}
                                            >
                                                <feature.icon className="w-5 h-5 text-white group-hover:text-black transition-colors" />
                                            </motion.div>

                                            {/* Title with underline on hover */}
                                            <h4 className="text-lg font-bold text-white mb-1 font-heading relative inline-block">
                                                {feature.title}
                                                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-white group-hover:w-full transition-all duration-300"></span>
                                            </h4>
                                            <p className="text-gray-500 text-sm group-hover:text-gray-400 transition-colors duration-300">{feature.desc}</p>

                                            {/* Arrow that slides in on hover */}
                                            <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                                                <ArrowRight className="w-4 h-4 text-white" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </section>
    );
};

// Demo Showcase with 3D Scroll Animation
const DemoShowcase = () => {
    return (
        <section className="bg-black relative overflow-hidden">
            <Suspense fallback={
                <div className="h-[60rem] flex items-center justify-center">
                    <div className="animate-pulse text-gray-500">Loading...</div>
                </div>
            }>
                <ContainerScroll
                    titleComponent={
                        <div className="mb-8">
                            <motion.span
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="inline-block px-4 py-1.5 text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6"
                            >
                                ✨ Dashboard Preview
                            </motion.span>
                            <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
                                <span className="text-gray-600">Experience the</span>
                                <br />
                                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                                    Future of Security
                                </span>
                            </h2>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                                Scroll to see our powerful dashboard in action
                            </p>
                        </div>
                    }
                >
                    {/* Dashboard Preview Image */}
                    <div className="h-full w-full relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80"
                            alt="Sentinel AI Dashboard"
                            className="w-full h-full object-cover opacity-80"
                        />
                        {/* Overlay with stats */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-8 left-8 right-8">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                                    <span className="text-green-400 font-mono text-sm">✓ 0 Critical Vulnerabilities</span>
                                </div>
                                <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                                    <span className="text-blue-400 font-mono text-sm">🛡️ Protected: 24/7</span>
                                </div>
                                <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                                    <span className="text-purple-400 font-mono text-sm">⚡ Last Scan: 2s ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </ContainerScroll>
            </Suspense>
        </section>
    );
};

const Testimonials = () => {
    const testimonials = [
        { name: "Sarah Jenkins", role: "CTO at TechFlow", text: "Sentinel saved us from a critical SQL injection week one. It's indispensable.", rating: 5, gradient: "from-blue-500 to-cyan-500" },
        { name: "David Chen", role: "Lead Dev at Nebula", text: "The auto-fix feature is like magic. It writes better patches than my junior devs.", rating: 5, gradient: "from-purple-500 to-pink-500" },
        { name: "Elena Rodriguez", role: "Security Engineer", text: "Finally, a security tool that developers actually love to use.", rating: 5, gradient: "from-green-500 to-emerald-500" },
        { name: "Marcus Johnson", role: "VP Engineering", text: "We reduced our vulnerability backlog by 80% in a month.", rating: 5, gradient: "from-orange-500 to-red-500" },
    ];

    return (
        <section id="testimonials" className="py-40 bg-black relative overflow-hidden">
            {/* Background blur orbs */}
            <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/2 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 mb-20 text-center relative z-10">
                <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-white/10 mb-8"
                >
                    <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-black text-white font-heading mb-4"
                >
                    <span className="text-gray-600">TRUSTED BY</span> EXPERTS
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-500 text-lg"
                >
                    Join 500+ engineering teams shipping secure code.
                </motion.p>
            </div>

            <div className="relative">
                {/* Enhanced blur gradients */}
                <div className="absolute inset-y-0 left-0 w-60 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>
                <div className="absolute inset-y-0 right-0 w-60 bg-gradient-to-l from-black via-black/80 to-transparent z-10"></div>

                <motion.div
                    className="flex space-x-8 px-6 min-w-max"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 35 }}
                >
                    {[...testimonials, ...testimonials].map((t, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="w-[420px] relative group"
                        >
                            {/* Card glow on hover */}
                            <div className={`absolute -inset-[1px] bg-gradient-to-r ${t.gradient} rounded-3xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500`}></div>

                            <div className="relative bg-[#0A0A0A]/80 backdrop-blur-sm border border-white/10 p-8 rounded-3xl group-hover:border-transparent transition-all duration-500">
                                {/* Quote icon */}
                                <div className="absolute -top-4 -left-2 text-6xl text-white/10 font-serif">"</div>

                                {/* Rating stars */}
                                <div className="flex space-x-1 mb-6">
                                    {[...Array(t.rating)].map((_, j) => (
                                        <motion.svg
                                            key={j}
                                            initial={{ scale: 0, rotate: -180 }}
                                            whileInView={{ scale: 1, rotate: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: j * 0.1 }}
                                            className="w-5 h-5 text-yellow-400 fill-current"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </motion.svg>
                                    ))}
                                </div>

                                <p className="text-lg text-gray-300 mb-8 font-light leading-relaxed relative z-10">
                                    "{t.text}"
                                </p>

                                <div className="flex items-center space-x-4">
                                    {/* Animated avatar */}
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${t.gradient} p-[2px]`}
                                    >
                                        <div className="w-full h-full rounded-full bg-[#0A0A0A] flex items-center justify-center text-white font-bold text-lg">
                                            {t.name.charAt(0)}
                                        </div>
                                    </motion.div>
                                    <div>
                                        <div className="text-white font-bold font-heading">{t.name}</div>
                                        <div className="text-sm text-gray-500">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

// How It Works Section - Premium Animated Version
const HowItWorks = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const pathLength = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

    const steps = [
        {
            step: "01",
            title: "Connect",
            subtitle: "Your Repository",
            description: "One-click integration with GitHub, GitLab, or Bitbucket. Instant sync.",
            icon: Github,
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            step: "02",
            title: "Scan",
            subtitle: "& Analyze",
            description: "AI deep-scans every line for vulnerabilities and security threats.",
            icon: Cpu,
            gradient: "from-purple-500 to-pink-500",
        },
        {
            step: "03",
            title: "Fix",
            subtitle: "Automatically",
            description: "Intelligent auto-patching with review before merging.",
            icon: Zap,
            gradient: "from-yellow-500 to-orange-500",
        },
        {
            step: "04",
            title: "Protect",
            subtitle: "24/7",
            description: "Real-time monitoring on every commit. Instant alerts.",
            icon: Shield,
            gradient: "from-green-500 to-emerald-500",
        },
    ];

    return (
        <section id="how-it-works" ref={containerRef} className="py-40 px-6 bg-black relative overflow-hidden">
            {/* Animated grid background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `radial-gradient(circle at center, white 1px, transparent 1px)`,
                    backgroundSize: '60px 60px'
                }}></div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -100, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                    />
                ))}
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/10 mb-8"
                    >
                        <Command className="w-8 h-8 text-white" />
                    </motion.div>

                    <h2 className="text-5xl md:text-7xl font-black text-white font-heading tracking-tight mb-6">
                        <span className="block text-gray-600">HOW IT</span>
                        <span className="block">WORKS</span>
                    </h2>
                    <p className="text-xl text-gray-500 max-w-xl mx-auto font-light">
                        Four steps to bulletproof security
                    </p>
                </motion.div>

                {/* Steps with animated connecting line */}
                <div className="relative">
                    {/* Animated SVG line connecting steps */}
                    <svg className="hidden lg:block absolute top-32 left-0 right-0 h-[2px] w-full overflow-visible" preserveAspectRatio="none">
                        <motion.line
                            x1="10%"
                            y1="0"
                            x2="90%"
                            y2="0"
                            stroke="url(#gradient)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            style={{ pathLength }}
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="33%" stopColor="#A855F7" />
                                <stop offset="66%" stopColor="#F59E0B" />
                                <stop offset="100%" stopColor="#10B981" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Steps Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.step}
                                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    delay: i * 0.15,
                                    duration: 0.6,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                                whileHover={{
                                    y: -10,
                                    transition: { duration: 0.3 }
                                }}
                                className="relative group perspective-1000"
                            >
                                {/* Glowing background on hover */}
                                <div className={`absolute -inset-1 bg-gradient-to-r ${step.gradient} rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}></div>

                                <div className="relative bg-[#080808] border border-white/5 rounded-3xl p-8 h-full group-hover:border-white/20 transition-all duration-500">
                                    {/* Step indicator with pulse */}
                                    <div className="relative mb-8">
                                        <div className={`absolute inset-0 bg-gradient-to-r ${step.gradient} rounded-full opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500`}></div>
                                        <div className="relative w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-500">
                                            <span className="text-lg font-black font-mono text-white group-hover:text-black transition-colors">{step.step}</span>
                                        </div>
                                        {/* Ping animation */}
                                        <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-0 group-hover:opacity-30"></div>
                                    </div>

                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} p-[1px] mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        <div className="w-full h-full rounded-xl bg-[#080808] flex items-center justify-center">
                                            <step.icon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>

                                    {/* Title with stagger effect */}
                                    <h3 className="text-3xl font-black text-white mb-1 font-heading tracking-tight">
                                        {step.title}
                                    </h3>
                                    <h4 className="text-lg font-medium text-gray-600 mb-4">{step.subtitle}</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>

                                    {/* Arrow indicator */}
                                    <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// Pricing Section - Enhanced with animations
const Pricing = ({ onNavigate }: { onNavigate: any }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const plans = [
        {
            name: 'Free',
            description: 'For individuals and open-source projects.',
            price: { monthly: 0, yearly: 0 },
            features: [
                'Core AI Analysis',
                'Unlimited Public Repos',
                'Studio Sandbox',
                '1 User',
            ],
            cta: 'Get Started',
            isPopular: false,
            gradient: 'from-white to-gray-200',
        },
        {
            name: 'Team',
            description: 'For professional teams building commercial software.',
            price: { monthly: 10, yearly: 8 },
            features: [
                'Everything in Free, plus:',
                'Unlimited Private Repos',
                'Contextual Code Analysis',
                'CI/CD Integration',
                'Priority Support',
            ],
            cta: 'Start Free Trial',
            isPopular: true,
            gradient: 'from-white to-gray-200',
        },
        {
            name: 'Enterprise',
            description: 'For large-scale organizations requiring custom solutions.',
            price: { monthly: 15, yearly: 12 },
            features: [
                'Everything in Team, plus:',
                'Custom Security Rules',
                'SSO & RBAC',
                'Dedicated Support',
                'SLA Guarantee',
            ],
            cta: 'Contact Sales',
            isPopular: false,
            gradient: 'from-white to-gray-200',
        }
    ];

    return (
        <section id="pricing" className="py-40 px-6 bg-black relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 opacity-[0.02]">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
                    backgroundSize: '80px 80px'
                }}></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-white/10 mb-8"
                    >
                        <Sparkles className="w-6 h-6 text-white" />
                    </motion.div>

                    <h2 className="text-5xl md:text-7xl font-black text-white font-heading tracking-tight mb-6">
                        <span className="block text-gray-600">TRANSPARENT</span>
                        <span className="block">PRICING</span>
                    </h2>
                    <p className="text-xl text-gray-500 max-w-xl mx-auto font-light mb-12">
                        Choose a plan that scales with your team
                    </p>

                    {/* Billing Toggle - Enhanced */}
                    <motion.div
                        className="inline-flex items-center space-x-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-8 py-4"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                    >
                        <span className={`text-sm font-semibold transition-all duration-300 ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-14 h-7 bg-white/10 rounded-full p-1 relative"
                        >
                            <motion.div
                                layout
                                className="w-5 h-5 bg-white rounded-full shadow-lg"
                                animate={{ x: billingCycle === 'yearly' ? 28 : 0 }}
                                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                            />
                        </button>
                        <span className={`text-sm font-semibold transition-all duration-300 ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>Yearly</span>
                        <motion.span
                            className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full"
                            animate={{ scale: billingCycle === 'yearly' ? [1, 1.1, 1] : 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            Save 20%
                        </motion.span>
                    </motion.div>
                </motion.div>

                {/* Plans Grid - Enhanced with animated borders */}
                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15, duration: 0.5 }}
                            whileHover={{ y: -8 }}
                            className="relative group"
                        >
                            {/* Animated border glow */}
                            <div className={`absolute -inset-[1px] bg-gradient-to-r ${plan.gradient} rounded-3xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500`}></div>

                            {/* Card */}
                            <div className={`relative h-full rounded-3xl p-8 flex flex-col transition-all duration-500 ${plan.isPopular
                                ? 'bg-white text-black'
                                : 'bg-[#0A0A0A] border border-white/10 group-hover:border-transparent'
                                }`}>
                                {/* Popular badge with animation */}
                                {plan.isPopular && (
                                    <motion.span
                                        className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1.5 rounded-full shadow-lg"
                                        initial={{ y: -20, opacity: 0 }}
                                        whileInView={{ y: 0, opacity: 1 }}
                                        viewport={{ once: true }}
                                    >
                                        Most Popular
                                    </motion.span>
                                )}

                                {/* Plan name with icon */}
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className={`w-8 h-8 rounded-lg ${plan.isPopular ? 'bg-black/10' : 'bg-white/5'} flex items-center justify-center`}>
                                        <Layers className={`w-4 h-4 ${plan.isPopular ? 'text-black' : 'text-white'}`} />
                                    </div>
                                    <h3 className={`text-2xl font-black font-heading ${plan.isPopular ? 'text-black' : 'text-white'}`}>{plan.name}</h3>
                                </div>
                                <p className={`text-sm mb-8 ${plan.isPopular ? 'text-gray-600' : 'text-gray-500'}`}>{plan.description}</p>

                                {/* Price with animation */}
                                <div className="mb-8">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={billingCycle}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {typeof plan.price.monthly === 'number' ? (
                                                <div className="flex items-baseline">
                                                    <span className={`text-6xl font-black ${plan.isPopular ? 'text-black' : 'text-white'}`}>
                                                        ${billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}
                                                    </span>
                                                    <span className={`text-sm ml-2 ${plan.isPopular ? 'text-gray-600' : 'text-gray-500'}`}>/user/mo</span>
                                                </div>
                                            ) : (
                                                <span className={`text-5xl font-black ${plan.isPopular ? 'text-black' : 'text-white'}`}>Custom</span>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Features with stagger animation */}
                                <ul className="space-y-4 mb-10 flex-grow">
                                    {plan.features.map((feature, j) => (
                                        <motion.li
                                            key={feature}
                                            className="flex items-center space-x-3"
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: i * 0.1 + j * 0.05 }}
                                        >
                                            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${plan.isPopular ? 'text-green-600' : 'text-green-400'}`} />
                                            <span className={`text-sm ${plan.isPopular ? 'text-gray-700' : 'text-gray-400'}`}>{feature}</span>
                                        </motion.li>
                                    ))}
                                </ul>

                                {/* CTA Button - Clean Consistent Style */}
                                <div className="relative group/btn">
                                    {/* Animated border */}
                                    <div className="absolute -inset-[1px] bg-white/20 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 blur-sm"></div>
                                    <motion.button
                                        onClick={() => onNavigate('auth')}
                                        whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(255, 255, 255, 0.2)" }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`relative w-full py-4 rounded-xl font-bold text-sm overflow-hidden transition-all duration-300 ${plan.isPopular
                                            ? 'bg-black text-white border border-white/20'
                                            : 'bg-white text-black'
                                            }`}
                                    >
                                        {/* Hover fill effect */}
                                        <span className={`absolute inset-0 ${plan.isPopular ? 'bg-white' : 'bg-black'} translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500 ease-out`}></span>

                                        {/* Content */}
                                        <span className={`relative flex items-center justify-center space-x-2 ${plan.isPopular ? 'group-hover/btn:text-black' : 'group-hover/btn:text-white'} transition-colors duration-300`}>
                                            <span>{plan.cta}</span>
                                            <motion.span
                                                animate={{ x: [0, 4, 0] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </motion.span>
                                        </span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CTA = ({ onNavigate }: { onNavigate: any }) => {
    return (
        <section className="py-40 px-6 bg-black relative overflow-hidden">
            {/* WebGL Shader background - Chromatic wave effect */}
            <div className="absolute inset-0 opacity-40">
                <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20" />}>
                    <WebGLShader xScale={1.2} yScale={0.3} distortion={0.08} />
                </Suspense>
            </div>
            {/* Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/30 rounded-full"
                        style={{
                            left: `${20 + i * 10}%`,
                            top: `${30 + (i % 3) * 20}%`,
                        }}
                        animate={{
                            y: [-20, 20, -20],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            <div className="max-w-4xl mx-auto text-center relative z-10">
                {/* Animated Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", duration: 1 }}
                    className="relative inline-flex mb-8"
                >
                    <div className="absolute inset-0 bg-white blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.4)]">
                        <Sparkles className="w-8 h-8" />
                    </div>
                </motion.div>

                {/* Animated heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-5xl md:text-7xl font-black text-white font-heading mb-8 tracking-tight leading-tight"
                >
                    <span className="block">READY TO SECURE</span>
                    <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">YOUR FUTURE?</span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light"
                >
                    Join thousands of developers who trust Sentinel to protect their codebases.
                    Start your free trial today.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    {/* Primary CTA - Magnetic hover effect */}
                    <motion.button
                        onClick={() => onNavigate('auth')}
                        whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(255,255,255,0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative px-12 py-5 bg-white text-black font-bold text-lg rounded-full overflow-hidden"
                    >
                        {/* Gradient sweep on hover */}
                        <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></span>
                        <span className="relative flex items-center space-x-2 group-hover:text-white transition-colors duration-300">
                            <span>Start Free Trial</span>
                            <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <ArrowRight className="w-5 h-5" />
                            </motion.span>
                        </span>
                    </motion.button>

                    {/* Secondary CTA - Outline style */}
                    <motion.button
                        whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        className="group px-12 py-5 border border-white/20 rounded-full text-gray-400 hover:text-white transition-all duration-300"
                    >
                        <span className="flex items-center space-x-2">
                            <span>Contact Sales</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};

const Footer = () => {
    const footerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: footerRef,
        offset: ["start end", "end end"]
    });

    const textY = useTransform(scrollYProgress, [0, 1], ['100px', '0px']);
    const textOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.5, 1]);
    const textScale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

    return (
        <footer ref={footerRef} className="relative py-40 px-6 bg-black overflow-hidden min-h-[60vh]">
            {/* White/Gray gradient glow behind text - NO purple */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[80%] h-[400px] bg-gradient-to-r from-white/5 via-white/10 to-white/5 blur-[100px] rounded-full"></div>
            </div>

            {/* Top ambient line - white only */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

            {/* Giant SENTINEL text - Metallic gray/white effect */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                style={{ y: textY, opacity: textOpacity, scale: textScale }}
            >
                <h1
                    className="text-[18vw] md:text-[15vw] font-black font-heading tracking-tighter whitespace-nowrap select-none"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 30%, rgba(150,150,150,0.5) 60%, rgba(100,100,100,0.3) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 80px rgba(255, 255, 255, 0.15), 0 0 160px rgba(255, 255, 255, 0.1)',
                    }}
                >
                    SENTINEL
                </h1>
            </motion.div>

            {/* Secondary layer for depth */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                style={{ y: textY, opacity: useTransform(textOpacity, (v) => v * 0.3) }}
            >
                <h1
                    className="text-[18vw] md:text-[15vw] font-black font-heading tracking-tighter whitespace-nowrap select-none text-white/5 blur-[2px]"
                    style={{ transform: 'translateY(3px)' }}
                >
                    SENTINEL
                </h1>
            </motion.div>

            {/* Bottom bar - Minimal with relevant links */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-0 left-0 right-0 px-6 py-8"
            >
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs tracking-widest uppercase">
                    {/* Left - Copyright & Status */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-gray-600 mb-4 md:mb-0 text-center md:text-left"
                    >
                        <span className="block md:inline">© 2025 Sentinel AI</span>
                        <span className="hidden md:inline mx-3">·</span>
                        <span className="block md:inline text-green-500/80">All Systems Operational</span>
                    </motion.div>

                    {/* Center - Relevant Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="flex space-x-8 mb-4 md:mb-0"
                    >
                        {['Documentation', 'Changelog', 'Privacy', 'Terms'].map((item) => (
                            <motion.a
                                key={item}
                                href="#"
                                whileHover={{ y: -2 }}
                                className="group text-gray-500 hover:text-white transition-colors relative"
                            >
                                <span>{item}</span>
                                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white group-hover:w-full transition-all duration-300"></span>
                            </motion.a>
                        ))}
                    </motion.div>

                    {/* Right - Credit */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-600 text-center md:text-right"
                    >
                        <span className="block md:inline">Engineered by</span>
                        <span className="hidden md:inline ml-2"></span>
                        <motion.a
                            href="https://synthesis-labs.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block md:inline text-white cursor-pointer hover:underline"
                            whileHover={{ scale: 1.05 }}
                        >
                            SYNTHESIS LABS
                        </motion.a>
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll to top indicator */}
            <motion.button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.1 }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/30 transition-all"
            >
                <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
            </motion.button>
        </footer>
    );
};

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
            <Navbar onNavigate={onNavigate} />
            <Hero onNavigate={onNavigate} />
            <Marquee />
            <Features />
            <DemoShowcase />
            <TechStackScroller />
            <HowItWorks />
            <Testimonials />
            <Pricing onNavigate={onNavigate} />
            <CTA onNavigate={onNavigate} />
            <Footer />
        </div>
    );
};

export default LandingPage;