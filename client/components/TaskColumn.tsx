'use client';

import React, { useState, useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, X, ListFilter } from 'lucide-react';
import { List, Priority, useBoardStore } from '../app/store';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskColumnProps {
    list: List;
}

export const TaskColumn: React.FC<TaskColumnProps> = React.memo(({ list }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<Priority>('low');
    const addCard = useBoardStore((state) => state.addCard);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            addCard(list.id, content.trim(), priority);
            setContent('');
            setPriority('low');
            setIsAdding(false);
        }
    };

    // Stable card list rendering
    const cards = useMemo(() => {
        return list.cards.map((card, index) => (
            <TaskCard key={card.id} card={card} index={index} listId={list.id} />
        ));
    }, [list.cards, list.id]);

    return (
        <div className="flex h-full w-80 flex-shrink-0 flex-col rounded-2xl glass p-4">
            <div className="mb-4 flex items-center justify-between px-2">
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    {list.title}
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                        {list.cards.length}
                    </span>
                </h3>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <ListFilter className="h-4 w-4" />
                </button>
            </div>

            <Droppable droppableId={list.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            'flex-grow overflow-y-auto no-scrollbar rounded-xl transition-colors duration-200',
                            snapshot.isDraggingOver ? 'bg-white/5' : 'bg-transparent'
                        )}
                    >
                        {cards}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            <div className="mt-4">
                <AnimatePresence mode="popLayout">
                    {isAdding ? (
                        <motion.form
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onSubmit={handleSubmit}
                            className="rounded-xl bg-zinc-800/50 p-3 border border-white/5"
                        >
                            <textarea
                                autoFocus
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What needs to be done?"
                                className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none resize-none"
                                rows={3}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        handleSubmit(e);
                                    }
                                }}
                            />

                            <div className="mt-2 flex items-center gap-2">
                                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={cn(
                                            'rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all',
                                            priority === p
                                                ? p === 'low' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50'
                                                    : p === 'medium' ? 'bg-amber-500/20 text-amber-500 border-amber-500/50'
                                                        : 'bg-rose-500/20 text-rose-500 border-rose-500/50'
                                                : 'border-white/5 bg-transparent text-zinc-500 hover:border-white/20'
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
                                >
                                    Add Card
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="group flex w-full items-center gap-2 rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-500 transition-all hover:border-primary/50 hover:text-primary"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add a card</span>
                        </button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
});

TaskColumn.displayName = 'TaskColumn';
