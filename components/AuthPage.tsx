import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { login, signup, loginWithGitHub } from '../services/authService';
import { User, AppView } from '../types';
import { useToast } from './ToastContext';
import { ArrowRight, Eye, EyeOff, Loader2, Mail, User as UserIcon, Lock, Sparkles, Github } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
  onNavigate: (view: AppView) => void;
  initialMode?: 'login' | 'signup';
}

// Logo Component
const Logo = ({ onNavigate }: { onNavigate: (view: AppView) => void }) => (
  <motion.div
    className="relative group cursor-pointer"
    onClick={() => onNavigate('landing')}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <div className="relative flex items-center space-x-2">
      <div className="w-9 h-9 relative flex items-center justify-center bg-black border border-white/20 rounded-lg">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="2.5" fill="currentColor" strokeWidth="0" />
          <circle cx="5" cy="7" r="1.5" fill="currentColor" strokeWidth="0" />
          <circle cx="19" cy="7" r="1.5" fill="currentColor" strokeWidth="0" />
          <circle cx="5" cy="17" r="1.5" fill="currentColor" strokeWidth="0" />
          <circle cx="19" cy="17" r="1.5" fill="currentColor" strokeWidth="0" />
          <line x1="5" y1="7" x2="12" y2="12" strokeLinecap="round" />
          <line x1="19" y1="7" x2="12" y2="12" strokeLinecap="round" />
          <line x1="5" y1="17" x2="12" y2="12" strokeLinecap="round" />
          <line x1="19" y1="17" x2="12" y2="12" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-lg font-bold text-white uppercase tracking-tight">Sentinel</span>
    </div>
  </motion.div>
);

// Full working Navbar
const Navbar = ({ onNavigate }: { onNavigate: (view: AppView) => void }) => {
  const goToSection = (sectionId: string) => {
    // Navigate to landing first, then scroll
    onNavigate('landing');
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
    >
      <div className="flex items-center justify-between px-5 py-2.5 rounded-full bg-black/70 backdrop-blur-xl border border-white/10 w-full max-w-4xl">
        <Logo onNavigate={onNavigate} />

        <div className="hidden md:flex items-center space-x-1">
          {['Features', 'How it Works', 'Testimonials', 'Pricing'].map((item) => (
            <button
              key={item}
              onClick={() => goToSection(item.toLowerCase().replace(/\s+/g, '-'))}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {item}
            </button>
          ))}
        </div>

        <motion.button
          onClick={() => onNavigate('landing')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          ← Home
        </motion.button>
      </div>
    </motion.nav>
  );
};

// VERY VISIBLE animated background with particles and waves
const AnimatedBackground = ({ typingCount }: { typingCount: number }) => {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Animated gradient blobs - VERY VISIBLE */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          top: '10%',
          left: '20%',
        }}
        animate={{
          x: [0, 100, 0, -50, 0],
          y: [0, 50, -30, 20, 0],
          scale: [1, 1.2, 0.9, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          bottom: '10%',
          right: '20%',
        }}
        animate={{
          x: [0, -80, 0, 60, 0],
          y: [0, -40, 60, -20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating particles - VERY VISIBLE */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-white/40 rounded-full"
          style={{
            left: `${5 + (i * 4) % 90}%`,
            top: `${10 + ((i * 7) % 80)}%`,
          }}
          animate={{
            y: [0, -30, 0, 30, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + (i % 3) * 2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}

      {/* Typing pulse waves */}
      {typingCount > 0 && (
        <motion.div
          key={typingCount}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white/30 rounded-full"
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 1 }}
        />
      )}

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <motion.line
          x1="10%" y1="20%" x2="40%" y2="50%"
          stroke="white" strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.line
          x1="60%" y1="30%" x2="90%" y2="60%"
          stroke="white" strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
        />
        <motion.line
          x1="20%" y1="70%" x2="50%" y2="90%"
          stroke="white" strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 2 }}
        />
      </svg>
    </div>
  );
};

// Compact animated logo
const AnimatedLogo = ({ isSwitching }: { isSwitching: boolean }) => (
  <motion.div
    className="relative w-16 h-16 mx-auto mb-4"
    animate={isSwitching ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
    transition={{ duration: 0.6 }}
  >
    {/* Rotating ring */}
    <motion.div
      className="absolute inset-0 border border-dashed border-white/20 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />

    {/* Glow */}
    <motion.div
      className="absolute inset-0 bg-white/10 rounded-full blur-xl"
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    />

    {/* Logo */}
    <div className="absolute inset-4 bg-black border border-white/30 rounded-xl flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5">
        <motion.circle
          cx="12" cy="12" r="2.5" fill="currentColor" strokeWidth="0"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <circle cx="5" cy="7" r="1.5" fill="currentColor" strokeWidth="0" />
        <circle cx="19" cy="7" r="1.5" fill="currentColor" strokeWidth="0" />
        <circle cx="5" cy="17" r="1.5" fill="currentColor" strokeWidth="0" />
        <circle cx="19" cy="17" r="1.5" fill="currentColor" strokeWidth="0" />
        <line x1="5" y1="7" x2="12" y2="12" strokeLinecap="round" />
        <line x1="19" y1="7" x2="12" y2="12" strokeLinecap="round" />
        <line x1="5" y1="17" x2="12" y2="12" strokeLinecap="round" />
        <line x1="19" y1="17" x2="12" y2="12" strokeLinecap="round" />
      </svg>
    </div>
  </motion.div>
);

// Compact input
const Input = ({
  icon: Icon, type, value, onChange, placeholder, showToggle, onType
}: {
  icon: any;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  showToggle?: boolean;
  onType?: () => void;
}) => {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <div className={`relative flex items-center bg-white/5 border rounded-xl transition-all ${focused ? 'border-white/40 bg-white/10' : 'border-white/10'}`}>
      <Icon className={`absolute left-3 w-4 h-4 ${focused ? 'text-white' : 'text-gray-500'}`} />
      <input
        type={showToggle && show ? 'text' : type}
        value={value}
        onChange={(e) => { onChange(e); onType?.(); }}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent pl-10 pr-10 py-3 text-white text-sm placeholder-gray-500 focus:outline-none"
      />
      {showToggle && (
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 text-gray-500 hover:text-white">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, onNavigate, initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [typingCount, setTypingCount] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);
  const { addToast } = useToast();

  const handleType = () => setTypingCount(c => c + 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let user;
      if (isLogin) {
        if (!email || !password) throw new Error('Please enter your email and password.');
        user = await login(email, password);
        addToast(`Welcome back, ${user.username}!`, 'success');
      } else {
        if (!email || !username || !password) throw new Error('Please fill in all fields.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters long.');
        user = await signup(email, username, password);
        addToast(`Account created! Welcome, ${user.username}.`, 'success');
      }
      onAuthSuccess(user);
    } catch (err: any) {
      addToast(err.message || 'An error occurred.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSwitching(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setEmail('');
      setUsername('');
      setPassword('');
      setIsSwitching(false);
    }, 300);
  };

  const handleGitHubLogin = async () => {
    setIsGitHubLoading(true);
    try {
      await loginWithGitHub();
      // The page will redirect to GitHub, so we don't need to handle success here
    } catch (err: any) {
      addToast(err.message || 'GitHub login failed.', 'error');
      setIsGitHubLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <AnimatedBackground typingCount={typingCount} />

      {/* Navbar */}
      <Navbar onNavigate={onNavigate} />

      {/* COMPACT Auth Card - fits on screen */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Card glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-white/20 rounded-2xl blur-sm opacity-50" />

          {/* Card */}
          <div className="relative bg-black/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            {/* Logo */}
            <AnimatedLogo isSwitching={isSwitching} />

            {/* Title */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center mb-5"
              >
                <h1 className="text-2xl font-bold text-white mb-1">
                  {isLogin ? 'Welcome Back' : 'Join Sentinel'}
                </h1>
                <p className="text-gray-500 text-xs">
                  {isLogin ? 'Sign in to continue' : 'Create your account'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input icon={UserIcon} type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" onType={handleType} />
                  </motion.div>
                )}
              </AnimatePresence>

              <Input icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" onType={handleType} />
              <Input icon={Lock} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" showToggle onType={handleType} />

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 mt-4 rounded-xl font-bold text-black bg-white flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="px-3 text-xs text-gray-600">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* GitHub Login */}
            <motion.button
              onClick={handleGitHubLogin}
              disabled={isGitHubLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-semibold text-white bg-[#24292e] hover:bg-[#2f363d] flex items-center justify-center space-x-3 disabled:opacity-50 transition-colors border border-white/10"
            >
              {isGitHubLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Github className="w-5 h-5" />
                  <span>Continue with GitHub</span>
                </>
              )}
            </motion.button>

            {/* Another divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="px-3 text-xs text-gray-600">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Toggle */}
            <motion.button
              onClick={toggleMode}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl border border-white/20 text-white text-sm font-medium hover:bg-white/5 transition-colors"
            >
              {isLogin ? 'Create Account' : 'Sign In Instead'}
            </motion.button>

            {/* Terms */}
            <p className="text-center text-xs text-gray-600 mt-4">
              By continuing, you agree to our{' '}
              <a href="#" className="text-white/60 hover:text-white underline">Terms</a>
              {' & '}
              <a href="#" className="text-white/60 hover:text-white underline">Privacy</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;