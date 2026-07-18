'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    AlignLeft,
    CheckSquare,
    Clock,
    Type,
    Trash2,
    Plus,
    AlertCircle,
    Calendar,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useBoardStore, Priority, Subtask, Card } from '@/app/store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export const CardDetailsModal: React.FC = () => {
    // Selective subscriptions to avoid re-rendering on unrelated store changes (toasts, notifications, ...)
    const lists = useBoardStore(state => state.lists);
    const activeCardId = useBoardStore(state => state.activeCardId);
    const closeCardDetails = useBoardStore(state => state.closeCardDetails);
    const updateCard = useBoardStore(state => state.updateCard);
    const deleteCard = useBoardStore(state => state.deleteCard);

    // Use useMemo to find active card and its list for better performance and reactivity
    const { activeCard, activeList } = React.useMemo(() => {
        for (const l of lists) {
            const foundCard = l.cards.find(c => c.id === activeCardId);
            if (foundCard) {
                return { activeCard: foundCard, activeList: l };
            }
        }
        return { activeCard: null, activeList: null };
    }, [lists, activeCardId]);

    const [content, setContent] = useState(activeCard?.content || '');
    const [description, setDescription] = useState(activeCard?.description || '');
    const [subtasks, setSubtasks] = useState<Subtask[]>(activeCard?.subtasks || []);
    const [newSubtask, setNewSubtask] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (activeCard) {
            setContent(activeCard.content);
            setDescription(activeCard.description || '');
            setSubtasks(activeCard.subtasks || []);
        }
    }, [activeCard]);

    // Close on Escape while the modal is open
    useEffect(() => {
        if (!activeCardId) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeCardDetails();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [activeCardId, closeCardDetails]);

    if (!activeCard) return null;

    const handleUpdate = async (updates: Partial<Card>) => {
        if (!activeList) return;
        setIsSaving(true);
        await updateCard(activeList.id, activeCard.id, updates);
        setIsSaving(false);
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtask.trim()) return;

        const newTask: Subtask = {
            id: crypto.randomUUID(),
            content: newSubtask.trim(),
            completed: false
        };

        const updatedSubtasks = [...subtasks, newTask];
        setSubtasks(updatedSubtasks);
        handleUpdate({ subtasks: updatedSubtasks });
        setNewSubtask('');
    };

    const toggleSubtask = (id: string) => {
        const updatedSubtasks = subtasks.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        );
        setSubtasks(updatedSubtasks);
        handleUpdate({ subtasks: updatedSubtasks });
    };

    const removeSubtask = (id: string) => {
        const updatedSubtasks = subtasks.filter(t => t.id !== id);
        setSubtasks(updatedSubtasks);
        handleUpdate({ subtasks: updatedSubtasks });
    };

    const completedSubtasks = subtasks.filter(t => t.completed).length;
    const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

    return (
        <AnimatePresence>
            {activeCardId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCardDetails}
                        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Card details"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl bg-white/5 border border-white/5",
                                    activeCard.priority === 'high' ? "text-rose-500" :
                                        activeCard.priority === 'medium' ? "text-amber-500" :
                                            "text-emerald-500"
                                )}>
                                    <Type className="h-5 w-5" />
                                </div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Card Details</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
                                <button
                                    onClick={closeCardDetails}
                                    className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                            {/* Title Section */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <Type className="h-4 w-4" />
                                    <span className="text-xs font-semibold uppercase tracking-wider">Title</span>
                                </div>
                                <input
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onBlur={() => content !== activeCard.content && handleUpdate({ content })}
                                    className="w-full bg-transparent text-2xl font-bold text-white outline-none focus:ring-0 placeholder-zinc-700"
                                    placeholder="Add a title..."
                                />
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Details Section */}
                                <section className="space-y-6">
                                    {/* Priority & List info */}
                                    <div className="flex flex-wrap gap-4">
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Priority</span>
                                            <div className="flex items-center gap-1.5">
                                                {PRIORITIES.map((p) => {
                                                    const active = activeCard.priority === p;
                                                    return (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => p !== activeCard.priority && handleUpdate({ priority: p })}
                                                            aria-pressed={active}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all",
                                                                active
                                                                    ? p === 'high' ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                                                        : p === 'medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                                    : "border-white/5 bg-transparent text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                                                            )}
                                                        >
                                                            {p}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">In List</span>
                                            <div className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-[11px] font-medium text-white">
                                                {activeList?.title || 'Unknown List'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <AlignLeft className="h-4 w-4" />
                                            <span className="text-xs font-semibold uppercase tracking-wider">Description</span>
                                        </div>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            onBlur={() => description !== activeCard.description && handleUpdate({ description })}
                                            className="w-full min-h-[120px] bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-zinc-300 outline-none focus:border-primary/50 transition-all resize-none placeholder-zinc-700"
                                            placeholder="Write a more detailed description..."
                                        />
                                    </div>
                                </section>

                                {/* Sidebar / Interactive Elements */}
                                <section className="space-y-8">
                                    {/* Subtasks Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <CheckSquare className="h-4 w-4" />
                                                <span className="text-xs font-semibold uppercase tracking-wider">Subtasks</span>
                                            </div>
                                            <span className="text-xs text-zinc-500">{completedSubtasks}/{subtasks.length}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                                            />
                                        </div>

                                        {/* Tasks List */}
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar pr-1">
                                            <AnimatePresence>
                                                {subtasks.map((task) => (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                                                    >
                                                        <button
                                                            onClick={() => toggleSubtask(task.id)}
                                                            className={cn(
                                                                "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
                                                                task.completed ? "bg-primary border-primary" : "border-white/20 hover:border-white/40"
                                                            )}
                                                        >
                                                            {task.completed && <ChevronRight className="h-3 w-3 text-white rotate-90" />}
                                                        </button>
                                                        <span className={cn(
                                                            "flex-1 text-sm transition-all",
                                                            task.completed ? "text-zinc-500 line-through" : "text-zinc-200"
                                                        )}>
                                                            {task.content}
                                                        </span>
                                                        <button
                                                            onClick={() => removeSubtask(task.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-500 transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>

                                        {/* Add Subtask Form */}
                                        <form onSubmit={handleAddSubtask} className="flex gap-2">
                                            <input
                                                value={newSubtask}
                                                onChange={(e) => setNewSubtask(e.target.value)}
                                                placeholder="Add a subtask..."
                                                className="flex-1 bg-white/5 border border-dashed border-white/10 rounded-xl px-4 py-2 text-sm text-zinc-300 outline-none focus:border-primary/50 transition-all"
                                            />
                                            <button
                                                type="submit"
                                                className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </button>
                                        </form>
                                    </div>

                                    {/* Dates & Quick Actions */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <Clock className="h-4 w-4" />
                                            <span className="text-xs font-semibold uppercase tracking-wider">Timeline</span>
                                        </div>
                                        <div className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 focus-within:border-primary/50 transition-all text-sm">
                                            <Calendar className="h-4 w-4 text-zinc-500 shrink-0" />
                                            <input
                                                type="date"
                                                aria-label="Deadline"
                                                value={
                                                    activeCard.deadline
                                                        ? format(new Date(activeCard.deadline), 'yyyy-MM-dd')
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    handleUpdate({
                                                        deadline: val ? new Date(val).toISOString() : null,
                                                    });
                                                }}
                                                className="flex-1 bg-transparent text-zinc-300 outline-none [color-scheme:dark] cursor-pointer"
                                            />
                                            {activeCard.deadline && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdate({ deadline: null })}
                                                    className="p-1 text-zinc-500 hover:text-rose-500 transition-colors shrink-0"
                                                    aria-label="Clear deadline"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (activeList) {
                                                    deleteCard(activeList.id, activeCard.id);
                                                    closeCardDetails();
                                                }
                                            }}
                                            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-rose-500/10 text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-sm font-medium"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Archive this card
                                        </button>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/5 flex items-center justify-between bg-zinc-950/20">
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                <AlertCircle className="h-3 w-3" />
                                <span>All changes are synced automatically</span>
                            </div>
                            <button
                                onClick={closeCardDetails}
                                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all border border-white/5"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
