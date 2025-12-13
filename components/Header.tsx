import React, { useState, useEffect, useRef } from 'react';
import { AppView, User, DashboardView } from '../types';
import { useTheme } from './ThemeContext';
import { MoonIcon, SunIcon, ChevronDownIcon, SentinelLogoIcon, SettingsIcon, GithubIcon, SearchIcon, UserIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  currentView: AppView;
  user: User | null;
  onNavigate: (view: AppView | DashboardView, options?: { initialMode?: 'login' | 'signup' }) => void;
  repoCount: number;
  autoReviewCount: number;
  onSignOut: () => void;
  onToggleSearch: () => void;
}

const UserMenu: React.FC<{ user: User; onNavigate: (view: DashboardView) => void; onSignOut: () => void; repoCount: number; autoReviewCount: number; }> = ({ user, onNavigate, onSignOut, repoCount, autoReviewCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitial = (username: string) => username ? username.charAt(0).toUpperCase() : 'U';
  const userInitial = getInitial(user.username);

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 group bg-white/5 hover:bg-white/10 border border-white/5 rounded-full pl-1 pr-3 py-1 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)] overflow-hidden border border-white/10">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            userInitial
          )}
        </div>
        <span className="hidden sm:inline font-bold text-white text-sm tracking-tight">{user.username}</span>
        <ChevronDownIcon className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-4 w-80 origin-top-right z-50"
          >
            <div className="bg-[#050505]/95 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10">
              {/* User Info */}
              <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full pointer-events-none" />
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 p-[2px] shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br from-blue-500 to-violet-500">
                          {userInitial}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-white truncate font-heading">{user.username}</p>
                    <p className="text-xs text-gray-400 truncate font-mono">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 border-b border-white/5">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-xl font-bold text-white font-heading">{repoCount}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Repos</p>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-xl font-bold text-white font-heading">{autoReviewCount}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Reviews</p>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <p className="text-xl font-bold text-white font-heading">{user.github?.public_repos || 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Public</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2 space-y-1">
                <button
                  onClick={() => { onNavigate('settings'); setIsOpen(false); }}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                    <SettingsIcon className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Settings</span>
                </button>
                {user.github && (
                  <a
                    href={user.github.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mr-3 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                      <GithubIcon className="w-4 h-4" />
                    </div>
                    <span className="font-medium">GitHub Profile</span>
                  </a>
                )}
                <div className="h-px bg-white/5 my-1 mx-2" />
                <button
                  onClick={() => { onSignOut(); setIsOpen(false); }}
                  className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mr-3 group-hover:bg-red-500/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <span className="font-bold">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavLink: React.FC<{ href?: string; onClick?: React.MouseEventHandler<HTMLAnchorElement>; children: React.ReactNode }> = ({ href, onClick, children }) => (
  <a
    href={href}
    onClick={onClick}
    className="relative text-gray-400 hover:text-white transition-colors group px-4 py-2 text-sm font-medium tracking-wide"
  >
    <span className="relative z-10">{children}</span>
    <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
  </a>
);

const Header: React.FC<HeaderProps> = ({ currentView, user, onNavigate, repoCount, autoReviewCount, onSignOut, onToggleSearch }) => {
  const { theme, toggleTheme } = useTheme();
  const isLanding = currentView === 'landing' || currentView === 'pricing';

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="mx-4 mt-4 pointer-events-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#050505]/80 backdrop-blur-xl rounded-full border border-white/10 px-6 py-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex justify-between items-center max-w-7xl mx-auto"
        >
          <div className="flex items-center gap-8">
            <motion.button
              onClick={() => onNavigate('landing')}
              className="flex items-center space-x-3 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                <SentinelLogoIcon className="w-6 h-auto relative z-10" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tighter font-heading">SENTINEL</h1>
            </motion.button>

            {isLanding && (
              <nav className="hidden md:flex items-center space-x-1">
                <NavLink href="#features" onClick={(e) => scrollToSection(e, '#features')}>Features</NavLink>
                <NavLink href="#" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }}>Pricing</NavLink>
                <NavLink href="#how-it-works" onClick={(e) => scrollToSection(e, '#how-it-works')}>How It Works</NavLink>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!isLanding && (
              <motion.button
                onClick={onToggleSearch}
                className="hidden md:flex items-center space-x-3 text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <SearchIcon className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
                <span className="text-xs font-medium">Search...</span>
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/5 font-mono text-gray-500 group-hover:text-gray-300">⌘K</span>
              </motion.button>
            )}

            <motion.button
              onClick={() => toggleTheme()}
              className="text-gray-500 hover:text-amber-400 transition-colors p-2.5 rounded-full hover:bg-white/5"
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
            </motion.button>

            <div className="h-6 w-px bg-white/10 mx-2" />

            {!user ? (
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={() => onNavigate('auth', { initialMode: 'login' })}
                  className="px-5 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
                <motion.button
                  onClick={() => onNavigate('auth', { initialMode: 'signup' })}
                  className="px-6 py-2 text-sm font-bold bg-white text-black rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
              </div>
            ) : isLanding ? (
              <motion.button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-2 text-sm font-bold bg-white text-black rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dashboard
              </motion.button>
            ) : (
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={() => onNavigate('studio')}
                  className="hidden md:inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all border border-white/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="mr-2">✨</span>
                  Studio
                </motion.button>
                <UserMenu user={user} onNavigate={onNavigate} onSignOut={onSignOut} repoCount={repoCount} autoReviewCount={autoReviewCount} />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;