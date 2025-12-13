import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import GlobalSearchModal from '../../components/GlobalSearchModal';
import { User, DashboardView, Repository, AppView } from '../../types';
import { logout } from '../../services/authService';

interface DashboardLayoutProps {
    user: User | null;
    repos: Repository[];
    onNavigate: (view: AppView | DashboardView, options?: any) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, repos }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Handle resize logic
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarCollapsed(true);
            } else {
                setIsSidebarCollapsed(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Global keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const getActiveView = (): DashboardView => {
        const path = location.pathname.replace('/app', '');
        if (path === '' || path === '/') return 'developerCommandCenter';
        const view = path.substring(1);
        return view.split('/')[0] as DashboardView;
    };

    const handleSidebarNavigate = (view: DashboardView) => {
        if (view === 'developerCommandCenter') {
            navigate('/app');
        } else {
            navigate(`/app/${view}`);
        }
    };

    const handleHeaderNavigate = (view: AppView | DashboardView, options?: any) => {
        if (view === 'landing') navigate('/');
        else if (view === 'pricing') navigate('/pricing');
        else if (view === 'auth') navigate('/login');
        else if (view === 'dashboard') navigate('/app');
        else if (view === 'studio') navigate('/app/studio');
        else if (view === 'settings') navigate('/app/settings');
    };

    const handleSearchNavigate = (view: DashboardView) => {
        setIsSearchOpen(false);
        if (view === 'developerCommandCenter') {
            navigate('/app');
        } else {
            navigate(`/app/${view}`);
        }
    };

    const handleSignOut = () => {
        logout();
        navigate('/');
        window.location.href = '/';
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            {/* Global Search Modal */}
            <GlobalSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                repos={repos}
                onNavigate={handleSearchNavigate}
            />

            <Header
                currentView="dashboard"
                user={user}
                onNavigate={handleHeaderNavigate}
                repoCount={repos.length}
                autoReviewCount={repos.filter(r => r.autoReview).length}
                onSignOut={handleSignOut}
                onToggleSearch={() => setIsSearchOpen(true)}
            />
            <Sidebar
                activeView={getActiveView()}
                setActiveView={handleSidebarNavigate}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />
            <main
                className="absolute top-24 right-0 bottom-0 overflow-y-auto p-6 md:p-8 transition-all duration-300 bg-black"
                style={{ left: isSidebarCollapsed ? '4.5rem' : '15rem' }}
            >
                <Suspense fallback={
                    <div className="h-full w-full flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-500 text-sm font-mono">Loading Module...</p>
                        </div>
                    </div>
                }>
                    <Outlet />
                </Suspense>
            </main>
        </div>
    );
};

export default DashboardLayout;
