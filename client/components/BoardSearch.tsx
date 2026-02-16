'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoardSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export const BoardSearch: React.FC<BoardSearchProps> = ({ value, onChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative flex-1 sm:flex-initial group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search boards..."
                className="h-11 w-full sm:w-48 lg:w-64 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all"
            />
            <AnimatePresence>
                {value && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={() => {
                            onChange('');
                            inputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X className="h-3.5 w-3.5" />
                    </motion.button>
                )}
            </AnimatePresence>
            {!value && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
                    <kbd className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-600 tracking-wider">⌘K</kbd>
                </div>
            )}
        </div>
    );
};
