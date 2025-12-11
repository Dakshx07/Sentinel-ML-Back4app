"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface RevealTextProps {
    text?: string;
    textColor?: string;
    overlayColor?: string;
    fontSize?: string;
    letterDelay?: number;
    overlayDelay?: number;
    overlayDuration?: number;
    springDuration?: number;
    letterImages?: string[];
}

// Security/code themed images for Sentinel
const defaultSecurityImages = [
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80", // Matrix code
    "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&q=80", // Code on screen
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", // Data center
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80", // Cybersecurity
    "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&q=80", // Blue tech
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80", // Circuit board
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80", // Coding
    "https://images.unsplash.com/photo-1562813733-b31f71025d54?w=800&q=80", // Neon cyber
];

export function RevealText({
    text = "SENTINEL",
    textColor = "text-white",
    overlayColor = "text-purple-500",
    fontSize = "text-[100px] md:text-[150px] lg:text-[180px]",
    letterDelay = 0.08,
    overlayDelay = 0.05,
    overlayDuration = 0.4,
    springDuration = 600,
    letterImages = defaultSecurityImages,
}: RevealTextProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        const lastLetterDelay = (text.length - 1) * letterDelay;
        const totalDelay = lastLetterDelay * 1000 + springDuration;

        const timer = setTimeout(() => {
            setShowOverlay(true);
        }, totalDelay);

        return () => clearTimeout(timer);
    }, [text.length, letterDelay, springDuration]);

    return (
        <div className="flex items-center justify-center relative">
            <div className="flex flex-wrap justify-center">
                {text.split("").map((letter, index) => (
                    <motion.span
                        key={index}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`${fontSize} font-black tracking-tighter cursor-pointer relative overflow-hidden`}
                        initial={{
                            scale: 0,
                            opacity: 0,
                        }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                        }}
                        transition={{
                            delay: index * letterDelay,
                            type: "spring",
                            damping: 8,
                            stiffness: 200,
                            mass: 0.8,
                        }}
                    >
                        {/* Base text layer */}
                        <motion.span
                            className={`absolute inset-0 ${textColor}`}
                            animate={{
                                opacity: hoveredIndex === index ? 0 : 1,
                            }}
                            transition={{ duration: 0.1 }}
                        >
                            {letter}
                        </motion.span>

                        {/* Image text layer with background panning */}
                        <motion.span
                            className="text-transparent bg-clip-text bg-cover bg-no-repeat"
                            animate={{
                                opacity: hoveredIndex === index ? 1 : 0,
                                backgroundPosition:
                                    hoveredIndex === index ? "10% center" : "0% center",
                            }}
                            transition={{
                                opacity: { duration: 0.1 },
                                backgroundPosition: {
                                    duration: 3,
                                    ease: "easeInOut",
                                },
                            }}
                            style={{
                                backgroundImage: `url('${letterImages[index % letterImages.length]}')`,
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            {letter}
                        </motion.span>

                        {/* Overlay text layer that sweeps across each letter */}
                        {showOverlay && (
                            <motion.span
                                className={`absolute inset-0 ${overlayColor} pointer-events-none`}
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: [0, 1, 1, 0],
                                }}
                                transition={{
                                    delay: index * overlayDelay,
                                    duration: overlayDuration,
                                    times: [0, 0.1, 0.7, 1],
                                    ease: "easeInOut",
                                }}
                            >
                                {letter}
                            </motion.span>
                        )}

                        {/* Invisible letter for spacing */}
                        <span className="invisible">{letter}</span>
                    </motion.span>
                ))}
            </div>
        </div>
    );
}

export default RevealText;
