'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { MoreHorizontal, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { Card, Priority, useBoardStore } from '../app/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';

interface TaskCardProps {
    card: Card;
    index: number;
    listId: string;
}

const priorityColors = {
    low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    high: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export const TaskCard: React.FC<TaskCardProps> = ({ card, index, listId }) => {
    const deleteCard = useBoardStore((state) => state.deleteCard);
    const openCardDetails = useBoardStore((state) => state.openCardDetails);

    return (
        <Draggable draggableId={card.id} index={index}>
            {(provided, snapshot) => {
                const usePortal = snapshot.isDragging;

                const child = (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => openCardDetails(card.id)}
                        className={cn(
                            'group relative mb-3 rounded-xl glass-card p-4 transition-all duration-200 hover:border-white/20 outline-none cursor-pointer',
                            snapshot.isDragging && 'z-[9999] scale-105 rotate-2 border-primary/50 shadow-primary/20 bg-zinc-800 pointer-events-none'
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <span
                                className={cn(
                                    'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                                    priorityColors[card.priority]
                                )}
                            >
                                {card.priority}
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCard(listId, card.id);
                                }}
                                className="opacity-0 transition-opacity group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-rose-500"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                            {card.content}
                        </p>

                        {card.deadline && (
                            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-400">
                                <Clock className="h-3 w-3" />
                                <span>{card.deadline}</span>
                            </div>
                        )}

                        {card.subtasks && card.subtasks.length > 0 && (
                            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-400">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>
                                    {card.subtasks.filter((s) => s.completed).length}/{card.subtasks.length} subtasks
                                </span>
                            </div>
                        )}
                    </div>
                );

                if (usePortal && typeof document !== 'undefined') {
                    return createPortal(child, document.body);
                }

                return child;
            }}
        </Draggable>
    );
};
