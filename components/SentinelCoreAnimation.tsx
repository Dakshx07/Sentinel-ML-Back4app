import React from 'react';
import { SentinelLogoIcon } from './icons';

const SentinelCoreAnimation: React.FC = () => {
    return (
        <div className="relative flex items-center justify-center w-48 h-48 mx-auto my-4">
            {/* Outer ring */}
            <div 
                className="absolute inset-0 border-2 border-brand-cyan/30 rounded-full animate-spin"
                style={{ animationDuration: '12s', animationTimingFunction: 'linear' }}
            ></div>
             {/* Middle ring */}
            <div 
                className="absolute inset-4 border border-brand-purple/40 rounded-full animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '9s', animationTimingFunction: 'linear' }}
            ></div>
            {/* Inner ring */}
             <div 
                className="absolute inset-8 border-2 border-brand-cyan/20 rounded-full animate-spin"
                style={{ animationDuration: '15s', animationTimingFunction: 'linear' }}
            ></div>

            {/* Pulsing core background */}
            <div className="absolute w-24 h-24 bg-brand-purple/20 rounded-full animate-pulse-slow"></div>
            
            {/* Central Icon */}
            <div className="relative w-20 h-20 bg-dark-primary rounded-full flex items-center justify-center shadow-2xl shadow-brand-purple/20">
                <SentinelLogoIcon className="w-10 h-10 text-brand-cyan" />
            </div>
             {/* Scanner line */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
                <div 
                    className="absolute top-1/2 left-1/2 w-[200%] h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent origin-center"
                    style={{ animation: 'scannerSpin 2.5s linear infinite', willChange: 'transform' }}
                ></div>
            </div>
        </div>
    );
};

export default SentinelCoreAnimation;