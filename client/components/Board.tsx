'use client';

import React, { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useBoardStore } from '../app/store';
import { TaskColumn } from './TaskColumn';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

export const Board: React.FC = () => {
    const { lists, moveCard, reorderCards, addList } = useBoardStore();
    const [isAddingList, setIsAddingList] = useState(false);
    const [listTitle, setListTitle] = useState('');

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            reorderCards(source.droppableId, source.index, destination.index);
        } else {
            moveCard(source.droppableId, destination.droppableId, draggableId, destination.index);
        }
    };

    const handleAddList = (e: React.FormEvent) => {
        e.preventDefault();
        if (listTitle.trim()) {
            addList(listTitle.trim());
            setListTitle('');
            setIsAddingList(false);
        }
    };

    return (
        <div className="h-full w-full overflow-x-auto p-6 no-scrollbar">
            <DragDropContext onDragEnd={onDragEnd}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex h-full items-start gap-6"
                >
                    {lists.map((list) => (
                        <TaskColumn key={list.id} list={list} />
                    ))}

                    <div className="w-80 flex-shrink-0">
                        <AnimatePresence mode="wait">
                            {isAddingList ? (
                                <motion.form
                                    key="add-list-form"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onSubmit={handleAddList}
                                    className="rounded-2xl glass p-4"
                                >
                                    <input
                                        autoFocus
                                        type="text"
                                        value={listTitle}
                                        onChange={(e) => setListTitle(e.target.value)}
                                        placeholder="Enter list title..."
                                        className="mb-3 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-primary/50 focus:bg-white/10"
                                    />
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingList(false)}
                                            className="p-2 text-zinc-500 hover:text-white transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="submit"
                                            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                                        >
                                            Add List
                                        </button>
                                    </div>
                                </motion.form>
                            ) : (
                                <motion.button
                                    key="add-list-button"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsAddingList(true)}
                                    className="flex h-12 w-full items-center gap-2 rounded-2xl glass px-4 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Add another list</span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </DragDropContext>
        </div>
    );
};
