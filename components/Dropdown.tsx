import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from './icons';

export interface DropdownItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    danger?: boolean;
}

interface DropdownProps {
    trigger: React.ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
    width?: string;
    className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'right', width = 'w-56', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 ${width} bg-[#050505] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl`}
                    >
                        <div className="py-1">
                            {items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (!item.disabled && item.onClick) {
                                            item.onClick();
                                            setIsOpen(false);
                                        }
                                    }}
                                    disabled={item.disabled}
                                    className={`w-full text-left px-4 py-3 text-sm flex items-center space-x-3 transition-colors ${item.disabled
                                            ? 'opacity-50 cursor-not-allowed text-gray-500'
                                            : item.danger
                                                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                                    <span className="font-medium truncate">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dropdown;
