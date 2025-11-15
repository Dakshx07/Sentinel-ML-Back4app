import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import PricingPage from './components/PricingPage';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import { AppView, User, DashboardView, Repository } from './types';
import { ThemeProvider } from './components/ThemeContext';
import { ToastProvider } from './components/ToastContext';
import GlobalSearchModal from './components/GlobalSearchModal';
import { getCurrentUser, logout, updateUser } from './services/authService';

type NavigateOptions = {
    repoFullName?: string;
    initialMode?: 'login' | 'signup';
};

const AppContent: React.FC = () => {
  const [view, setView] = useState<AppView>('landing');
  const [dashboardView, setDashboardView] = useState<DashboardView>('developerCommandCenter');
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const loggedInUser = getCurrentUser();
    if (loggedInUser) {
        setUser(loggedInUser);
        setView('dashboard'); 
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsSearchOpen(isOpen => !isOpen);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (user) {
        const savedReposJson = localStorage.getItem(`sentinel-repos-${user.email}`);
        if (savedReposJson) {
            try {
                const savedRepos: Repository[] = JSON.parse(savedReposJson);
                const normalizedRepos = savedRepos.map(repo => ({
                    ...repo,
                    autoReview: repo.autoReview === true,
                }));
                setRepos(normalizedRepos);
            } catch (error) {
                console.error("Failed to parse repos from local storage:", error);
                setRepos([]);
            }
        }
    } else {
        setRepos([]); 
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        localStorage.setItem(`sentinel-repos-${user.email}`, JSON.stringify(repos));
    }
  }, [repos, user]);
  
  const handleNavigate = (targetView: AppView | DashboardView, options: NavigateOptions = {}) => {
    window.scrollTo(0, 0);
    
    const dashboardViews: DashboardView[] = [
        'developerCommandCenter', 'smartAlerts', 'repositories', 
        'studio', 'gitops', 'commits', 'settings', 'docs', 'pushpull', 'refactor', 
        'repoReport', 'workflowStreamliner', 'imageGenerator', 'readmeGenerator'
    ];
    
    if (targetView === 'auth') {
        setAuthInitialMode(options.initialMode || 'login');
        setView('auth');
    } else if (dashboardViews.includes(targetView as DashboardView)) {
        if (user) {
            setView('dashboard');
            setDashboardView(targetView as DashboardView);
        } else {
            setAuthInitialMode('login'); 
            setView('auth'); 
        }
    } else {
        setView(targetView as AppView);
    }
  }

  const handleProfileUpdate = (updatedProfile: Partial<User>) => {
      setUser(currentUser => {
          if (!currentUser) return null;
          const newUser = { ...currentUser, ...updatedProfile };
          if (updatedProfile.github && updatedProfile.github.avatar_url) {
              newUser.avatarUrl = updatedProfile.github.avatar_url;
          }
          updateUser(newUser);
          return newUser;
      });
  }
  
  const handleSignOut = () => {
    logout();
    setUser(null);
    setView('landing');
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
      setUser(authenticatedUser);
      setView('dashboard');
      setDashboardView('developerCommandCenter');
  };

  const renderView = () => {
    switch(view) {
        case 'landing':
            return <LandingPage onNavigate={handleNavigate} />;
        case 'pricing':
            return <PricingPage onNavigate={handleNavigate} />;
        case 'auth':
            return <AuthPage onAuthSuccess={handleAuthSuccess} onNavigate={setView} initialMode={authInitialMode} />;
        case 'dashboard':
            if (!user) { 
                return <AuthPage onAuthSuccess={handleAuthSuccess} onNavigate={setView} initialMode="login" />;
            }
            return <Dashboard user={user} activeView={dashboardView} setActiveView={setDashboardView} onProfileUpdate={handleProfileUpdate} repos={repos} setRepos={setRepos} />;
        default:
            return <LandingPage onNavigate={handleNavigate} />;
    }
  }
  
  const repoCount = repos.length;
  const autoReviewCount = repos.filter(r => r.autoReview).length;

  return (
    <div className="min-h-screen text-dark-text dark:text-light-text font-sans bg-light-primary dark:bg-dark-primary">
      <Header 
          currentView={view} 
          user={user}
          onNavigate={handleNavigate}
          repoCount={repoCount}
          autoReviewCount={autoReviewCount}
          onSignOut={handleSignOut}
          onToggleSearch={() => setIsSearchOpen(true)}
      />
      {user && <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        repos={repos}
        onNavigate={handleNavigate}
      />}
      <main className={view !== 'dashboard' ? 'pt-16' : ''}>
        {renderView()}
      </main>
    </div>
  );
};


const App: React.FC = () => (
  <ThemeProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </ThemeProvider>
);

export default App;