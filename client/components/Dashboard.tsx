'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Trash2,
    Layout,
    Clock,
    ChevronRight,
    Search,
    Filter,
    Bell,
    Check,
    X as Close,
    Sparkles
} from 'lucide-react';
import { useBoardStore, Board } from '@/app/store';
import { useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

export const Dashboard: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const boards = useBoardStore(state => state.boards);
    const invites = useBoardStore(state => state.invites);
    const addBoard = useBoardStore(state => state.addBoard);
    const deleteBoard = useBoardStore(state => state.deleteBoard);
    const selectBoard = useBoardStore(state => state.selectBoard);
    const acceptInvite = useBoardStore(state => state.acceptInvite);
    const declineInvite = useBoardStore(state => state.declineInvite);

    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const handleBoardClick = useCallback((id: string) => {
        selectBoard(id);
        router.push(`/board/${id}`);
    }, [selectBoard, router]);

    // Memoize board filtering
    const { ownedBoards, sharedBoards } = useMemo(() => {
        const userId = session?.user?.id;
        return {
            ownedBoards: boards.filter(b => b.userId === userId),
            sharedBoards: boards.filter(b => b.userId !== userId)
        };
    }, [boards, session?.user?.id]);

    const handleCreate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        const newBoard = await addBoard(newTitle.trim());
        if (newBoard) {
            router.push(`/board/${newBoard.id}`);
        }
        setNewTitle('');
        setIsCreating(false);
    }, [addBoard, newTitle, router]);

    const renderBoardGrid = useCallback((boardsToRender: Board[], showCreate = false) => {
        const userId = session?.user?.id;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {showCreate && (
                    <AnimatePresence mode="popLayout">
                        {isCreating ? (
                            <motion.form
                                key="create-form"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onSubmit={handleCreate}
                                className="relative h-40 sm:h-48 rounded-3xl border border-primary/30 bg-primary/5 p-5 sm:p-6 flex flex-col justify-between overflow-hidden group shadow-2xl shadow-primary/10"
                            >
                                <div className="space-y-3 sm:space-y-4 relative z-10">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">New Project</span>
                                    <input
                                        autoFocus
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="Board Title..."
                                        className="w-full bg-transparent text-lg sm:text-xl font-bold text-white outline-none placeholder-zinc-700"
                                    />
                                </div>
                                <div className="flex items-center justify-between relative z-10 font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="text-[11px] sm:text-xs text-zinc-500 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-primary text-white text-[10px] sm:text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                    >
                                        Create
                                    </button>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
                            </motion.form>
                        ) : (
                            <motion.button
                                key="create-btn"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setIsCreating(true)}
                                className="h-40 sm:h-48 rounded-3xl border border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 group transition-all flex flex-col items-center justify-center gap-3 sm:gap-4 group"
                            >
                                <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 group-hover:text-primary group-hover:scale-110 transition-all">
                                    <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-zinc-500 group-hover:text-white transition-colors">New board</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                )}

                {boardsToRender.map((board, index) => {
                    const isOwner = board.userId === userId;
                    return (
                        <motion.div
                            key={board.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            layout="position"
                            onClick={() => handleBoardClick(board.id)}
                            className="group relative h-40 sm:h-48 rounded-3xl border border-white/5 bg-zinc-900/40 p-5 sm:p-6 flex flex-col justify-between hover:border-white/20 hover:bg-zinc-800/40 transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="relative z-10 flex items-start justify-between">
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-primary transition-colors truncate">{board.title}</h3>
                                        {!isOwner && (
                                            <span className="bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0">Shared</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] sm:text-xs font-medium">
                                        <Clock className="h-3 w-3" />
                                        <span>{isOwner ? 'Personal' : 'External'}</span>
                                    </div>
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this board?')) deleteBoard(board.id);
                                        }}
                                        className="p-2 rounded-xl bg-white/5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex -space-x-1.5 sm:-space-x-2">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-zinc-950 bg-zinc-800 overflow-hidden shrink-0">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + index}`} alt="User" />
                                        </div>
                                    ))}
                                    <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center text-[8px] sm:text-[10px] text-zinc-500 font-bold shrink-0">
                                        +3
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 group-hover:text-white transition-colors">
                                    <span className="hidden xs:inline">VIEW BOARD</span>
                                    <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 sm:group-hover:translate-x-1" />
                                </div>
                            </div>

                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all" />
                        </motion.div>
                    );
                })}
            </div>
        );
    }, [isCreating, newTitle, handleCreate, selectBoard, deleteBoard, session?.user?.id]);

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background text-zinc-200">
            <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold tracking-tighter text-sm uppercase">
                            <Sparkles className="h-4 w-4" />
                            <span>Workspace</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">Your Boards</h1>
                        <p className="text-zinc-500 max-w-md text-sm sm:text-base">Manage your projects, ideas, and workflows in one centralized hub.</p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <input
                                placeholder="Search..."
                                className="h-11 w-full sm:w-48 lg:w-64 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-300 outline-none focus:border-primary/50 transition-all"
                            />
                        </div>
                        <button className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all">
                            <Filter className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <AnimatePresence>
                    {invites.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-2 text-primary font-bold tracking-tighter text-xs uppercase">
                                <Bell className="h-3 w-3" />
                                <span>Pending Invitations ({invites.length})</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {invites.map((invite) => (
                                    <motion.div
                                        key={invite.id}
                                        layout
                                        className="p-3 sm:p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <Layout className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-white truncate">
                                                    Invite to <span className="text-primary italic">"{invite.board.title}"</span>
                                                </h4>
                                                <p className="text-[11px] text-zinc-500 truncate">
                                                    From {invite.inviter.name || invite.inviter.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:shrink-0 justify-end">
                                            <button
                                                onClick={() => declineInvite(invite.id)}
                                                className="p-2 rounded-xl text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-bold text-xs uppercase tracking-widest px-3"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => acceptInvite(invite.id)}
                                                className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] sm:text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                            >
                                                <Check className="h-3 w-3" />
                                                Accept
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base sm:text-lg font-bold text-white">Your Boards</h2>
                        <span className="h-1 flex-1 bg-white/5 rounded-full" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{ownedBoards.length} Total</span>
                    </div>
                    {renderBoardGrid(ownedBoards, true)}
                </section>

                {sharedBoards.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-base sm:text-lg font-bold text-white">Shared with Me</h2>
                            <span className="h-1 flex-1 bg-white/5 rounded-full" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{sharedBoards.length} Boards</span>
                        </div>
                        {renderBoardGrid(sharedBoards, false)}
                    </section>
                )}

                {boards.length === 0 && !isCreating && (
                    <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="p-4 sm:p-6 rounded-3xl bg-white/5">
                            <Layout className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-600" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg sm:text-xl font-bold text-white italic">Clean Slate</h3>
                            <p className="text-xs sm:text-sm text-zinc-500">No boards yet. Start your first journey now.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
