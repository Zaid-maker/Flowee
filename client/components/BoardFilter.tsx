'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ArrowUpDown, Eye, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption = 'title-asc' | 'title-desc' | 'date-newest' | 'date-oldest';
export type FilterOption = 'all' | 'owned' | 'shared';

interface BoardFilterProps {
    sortBy: SortOption;
    filterType: FilterOption;
    onSortChange: (sort: SortOption) => void;
    onFilterChange: (filter: FilterOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'title-asc', label: 'Title A → Z' },
    { value: 'title-desc', label: 'Title Z → A' },
    { value: 'date-newest', label: 'Newest first' },
    { value: 'date-oldest', label: 'Oldest first' },
];

const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All boards' },
    { value: 'owned', label: 'My boards' },
    { value: 'shared', label: 'Shared with me' },
];

export const BoardFilter: React.FC<BoardFilterProps> = ({
    sortBy,
    filterType,
    onSortChange,
    onFilterChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const hasActiveFilter = filterType !== 'all' || sortBy !== 'date-newest';

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-11 px-4 rounded-xl border text-zinc-400 hover:text-white transition-all flex items-center gap-2",
                    hasActiveFilter
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-white/5 border-white/10"
                )}
            >
                <Filter className="h-4 w-4" />
                {hasActiveFilter && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 z-50 bg-zinc-900 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-3xl"
                    >
                        {/* Sort Section */}
                        <div className="p-3 space-y-1">
                            <div className="flex items-center gap-2 px-2 py-1.5">
                                <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sort By</span>
                            </div>
                            {sortOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => onSortChange(opt.value)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all",
                                        sortBy === opt.value
                                            ? "bg-primary/10 text-primary"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {opt.label}
                                    {sortBy === opt.value && <Check className="h-3 w-3" />}
                                </button>
                            ))}
                        </div>

                        <div className="h-px bg-white/5 mx-3" />

                        {/* Filter Section */}
                        <div className="p-3 space-y-1">
                            <div className="flex items-center gap-2 px-2 py-1.5">
                                <Eye className="h-3 w-3 text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Show</span>
                            </div>
                            {filterOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => onFilterChange(opt.value)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all",
                                        filterType === opt.value
                                            ? "bg-primary/10 text-primary"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {opt.label}
                                    {filterType === opt.value && <Check className="h-3 w-3" />}
                                </button>
                            ))}
                        </div>

                        {/* Reset */}
                        {hasActiveFilter && (
                            <>
                                <div className="h-px bg-white/5 mx-3" />
                                <div className="p-3">
                                    <button
                                        onClick={() => {
                                            onSortChange('date-newest');
                                            onFilterChange('all');
                                        }}
                                        className="w-full px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-center"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
