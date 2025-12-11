import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * LandingLayout is a minimal wrapper for public-facing pages (Landing, Pricing, Auth).
 * The Navbar is now part of each individual page (e.g., LandingPage.tsx) for full design control.
 */
const LandingLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <Outlet />
        </div>
    );
};

export default LandingLayout;
