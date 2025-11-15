import React, { useRef, useEffect } from 'react';

const HeroAnimation: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setCanvasSize();

        const characters = 'const fn=()=>{} 010101 <>/"=+-*[]';
        const columns = Math.floor(canvas.width / 20);
        const drops: number[] = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        let animationFrameId: number;

        const draw = () => {
            const isDark = document.documentElement.classList.contains('dark');
            ctx.fillStyle = isDark ? 'rgba(10, 10, 31, 0.05)' : 'rgba(243, 244, 246, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = isDark ? '#9F54FF' : '#00D4FF'; // Purple for dark, Cyan for light
            ctx.font = '16px Fira Code';

            for (let i = 0; i < drops.length; i++) {
                const text = characters[Math.floor(Math.random() * characters.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);

                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            animationFrameId = requestAnimationFrame(draw);
        };
        draw();
        
        const handleResize = () => {
            setCanvasSize();
            // Recalculate columns and drops array on resize
            const newColumns = Math.floor(canvas.width / 20);
            drops.length = 0;
            for (let x = 0; x < newColumns; x++) {
                drops[x] = 1;
            }
        };

        const handleScroll = () => {
            if (canvasRef.current) {
                // Move the canvas down at half the scroll speed for a parallax effect.
                canvasRef.current.style.transform = `translateY(${window.scrollY * 0.5}px)`;
            }
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(animationFrameId);
        };

    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full z-0 opacity-50 dark:opacity-100" 
        />
    );
};

export default HeroAnimation;