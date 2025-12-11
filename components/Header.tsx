import React, { useState, useEffect, useRef } from 'react';
import { AppView, User, DashboardView } from '../types';
import { useTheme } from './ThemeContext';
import { MoonIcon, SunIcon, ChevronDownIcon, SentinelLogoIcon, SettingsIcon, GithubIcon, SearchIcon } from './icons';
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
        className="flex items-center space-x-2 group"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-blue-500/20">
          {userInitial}
        </div>
        <span className="hidden sm:inline font-medium text-white/90 text-sm">{user.username}</span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-72 origin-top-right z-50"
          >
            <div className="bg-[#0A0A0A] backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
              {/* User Info */}
              <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-blue-500/5 to-violet-500/5">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="px-5 py-4 border-b border-white/5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-blue-500/10">
                    <p className="text-lg font-bold text-blue-400">{repoCount}</p>
                    <p className="text-[10px] text-gray-500">Repos</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                    <p className="text-lg font-bold text-emerald-400">{autoReviewCount}</p>
                    <p className="text-[10px] text-gray-500">Reviews</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-violet-500/10">
                    <p className="text-lg font-bold text-violet-400">{user.github?.public_repos || 0}</p>
                    <p className="text-[10px] text-gray-500">Public</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="py-1">
                <button
                  onClick={() => { onNavigate('settings'); setIsOpen(false); }}
                  className="flex items-center w-full px-5 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 mr-3" />
                  <span>Settings</span>
                </button>
                {user.github && (
                  <a
                    href={user.github.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center w-full px-5 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <GithubIcon className="w-4 h-4 mr-3" />
                    <span>GitHub Profile</span>
                  </a>
                )}
                <button
                  onClick={() => { onSignOut(); setIsOpen(false); }}
                  className="flex items-center w-full px-5 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
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
    className="relative text-gray-500 hover:text-white transition-colors group px-3 py-2 text-sm"
  >
    <span className="relative z-10">{children}</span>
    <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-gradient-to-r from-blue-500 to-violet-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
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
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0A0A0A]/90 backdrop-blur-2xl rounded-2xl border border-white/10 px-5 shadow-2xl shadow-black/50"
        >
          <div className="flex justify-between items-center h-14">
            <motion.button
              onClick={() => onNavigate('landing')}
              className="flex items-center space-x-2.5 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SentinelLogoIcon className="w-5 h-auto" />
              <h1 className="text-lg font-bold text-white tracking-tight">Sentinel</h1>
            </motion.button>

            {isLanding && (
              <nav className="hidden md:flex items-center space-x-1">
                <NavLink href="#features" onClick={(e) => scrollToSection(e, '#features')}>Features</NavLink>
                <NavLink href="#" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }}>Pricing</NavLink>
                <NavLink href="#how-it-works" onClick={(e) => scrollToSection(e, '#how-it-works')}>How It Works</NavLink>
              </nav>
            )}

            <div className="flex items-center space-x-1">
              {!isLanding && (
                <motion.button
                  onClick={onToggleSearch}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors px-3 py-2 rounded-lg hover:bg-blue-500/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <SearchIcon className="w-4 h-4" />
                  <span className="hidden md:inline-block text-[10px] border border-white/10 rounded px-1.5 py-0.5 font-mono text-gray-600">⌘K</span>
                </motion.button>
              )}

              <motion.button
                onClick={() => toggleTheme()}
                className="text-gray-500 hover:text-amber-400 transition-colors p-2 rounded-lg hover:bg-amber-500/10"
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
              </motion.button>

              {!user ? (
                <div className="flex items-center space-x-2 ml-2">
                  <motion.button
                    onClick={() => onNavigate('auth', { initialMode: 'login' })}
                    className="px-4 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    onClick={() => onNavigate('auth', { initialMode: 'signup' })}
                    className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign Up
                  </motion.button>
                </div>
              ) : isLanding ? (
                <motion.button
                  onClick={() => onNavigate('dashboard')}
                  className="ml-2 px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Dashboard
                </motion.button>
              ) : (
                <div className="flex items-center space-x-2 ml-2">
                  <motion.button
                    onClick={() => onNavigate('studio')}
                    className="hidden md:inline-block px-3 py-1.5 text-sm font-medium text-violet-400 hover:text-violet-300 border border-violet-500/30 rounded-lg hover:border-violet-500/50 hover:bg-violet-500/10 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Studio
                  </motion.button>
                  <UserMenu user={user} onNavigate={onNavigate} onSignOut={onSignOut} repoCount={repoCount} autoReviewCount={autoReviewCount} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;