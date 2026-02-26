'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    parseISO,
    isToday
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    Sparkles,
    Layout
} from 'lucide-react';
import { getCalendarCards } from '@/app/actions/board';
import { cn } from '@/lib/utils';
import { useBoardStore } from '@/app/store';

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const selectBoard = useBoardStore(state => state.selectBoard);

    useEffect(() => {
        const fetchCards = async () => {
            setLoading(true);
            const data = await getCalendarCards();
            if (data) setCards(data);
            setLoading(false);
        };
        fetchCards();
    }, []);

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => setCurrentDate(new Date());

    const getCardsForDay = (day: Date) => {
        return cards.filter(card => isSameDay(parseISO(card.deadline), day));
    };

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold tracking-tighter text-sm uppercase">
                        <Sparkles className="h-4 w-4" />
                        <span>Schedule</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <CalendarIcon className="h-8 w-8 text-primary" />
                        {format(currentDate, 'MMMM yyyy')}
                    </h1>
                </div>

                <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Today
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Calendar Grid */}
            <div className="flex-1 bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden flex flex-col backdrop-blur-sm relative">
                {/* Weekdays Header */}
                <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.02]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="py-4 text-center">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">{day}</span>
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto no-scrollbar">
                    {days.map((day, idx) => {
                        const dayCards = getCardsForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isTodayDay = isToday(day);

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "min-h-[120px] p-2 border-r border-b border-white/5 last:border-r-0 relative group transition-colors",
                                    !isCurrentMonth ? "bg-zinc-950/20" : "bg-transparent",
                                    "hover:bg-white/[0.02]"
                                )}
                            >
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <span className={cn(
                                        "text-xs font-bold flex items-center justify-center w-7 h-7 rounded-full transition-all",
                                        isTodayDay
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : isCurrentMonth ? "text-zinc-400 group-hover:text-white" : "text-zinc-700"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    {dayCards.slice(0, 3).map((card) => (
                                        <motion.div
                                            key={card.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="group/card relative p-2 rounded-lg bg-zinc-800/50 border border-white/5 hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
                                            style={{ borderLeftColor: card.board.color || '#3b82f6', borderLeftWidth: '3px' }}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Layout className="h-2.5 w-2.5 text-zinc-500" />
                                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter truncate">
                                                    {card.board.title}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-semibold text-zinc-200 line-clamp-2 leading-snug group-hover/card:text-white transition-colors">
                                                {card.content}
                                            </p>
                                        </motion.div>
                                    ))}
                                    {dayCards.length > 3 && (
                                        <div className="px-2 py-1">
                                            <span className="text-[9px] font-bold text-zinc-600">
                                                + {dayCards.length - 3} more
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="flex flex-col items-center gap-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full"
                            />
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Synchronizing...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend / Upcoming */}
            <footer className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Due Soon</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-500 italic text-[11px]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Showing all cards with deadlines across your workspace.</span>
                </div>
            </footer>
        </div>
    );
}
