'use client';

import React, { useState } from 'react';
import {
    Menu,
    ChevronLeft,
    Search,
    UserPlus,
    Loader2
} from 'lucide-react';
import { useBoardStore } from '@/app/store';
import { useSession } from '@/lib/auth-client';
import { NotificationCenter } from '@/components/NotificationCenter';
import { InviteModal } from '@/components/InviteModal';
import { usePathname } from 'next/navigation';

interface NavbarProps {
    onOpenMobileSidebar: () => void;
    onDashboardClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
    onOpenMobileSidebar,
    onDashboardClick
}) => {
    const { data: session } = useSession();
    const boards = useBoardStore(state => state.boards);
    const activeBoardId = useBoardStore(state => state.activeBoardId);
    const activeBoardMembers = useBoardStore(state => state.activeBoardMembers);
    const pathname = usePathname();

    const [isInviteOpen, setIsInviteOpen] = useState(false);

    if (!session) return null;

    const activeBoard = boards.find(b => b.id === activeBoardId);

    return (
        <>
            <header className="flex h-20 items-center justify-between border-b border-white/5 px-4 sm:px-8 bg-zinc-950/20 backdrop-blur-md relative z-[10]">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <button
                        onClick={onOpenMobileSidebar}
                        className="p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all lg:hidden flex-shrink-0"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    {activeBoardId && (
                        <button
                            onClick={onDashboardClick}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all sm:mr-2 flex-shrink-0"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                    )}
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white leading-tight truncate">
                            {activeBoardId ? activeBoard?.title : pathname === '/calendar' ? 'Calendar' : `Welcome, ${session.user.name || 'User'}`}
                        </h1>
                        <p className="text-[10px] sm:text-xs font-medium text-zinc-500 tracking-wide uppercase truncate">
                            {activeBoardId ? 'Board Interface' : pathname === '/calendar' ? 'Deadlines & Schedule' : 'Personal Dashboard'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <div className="relative hidden lg:block">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Universal search..."
                            className="h-10 rounded-xl border border-white/5 bg-white/5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition-all focus:border-primary/50 focus:bg-white/10 w-64"
                        />
                    </div>

                    <div className="flex items-center gap-1 sm:gap-3">
                        <NotificationCenter />

                        <div className="hidden md:flex -space-x-2 mr-2">
                            {activeBoardMembers.slice(0, 3).map((member) => (
                                <div
                                    key={member.id}
                                    className="h-8 w-8 rounded-lg border-2 border-zinc-950 overflow-hidden bg-zinc-800"
                                    title={member.user.name || member.user.email}
                                >
                                    <img
                                        src={member.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.email}`}
                                        alt="Member"
                                    />
                                </div>
                            ))}
                            {activeBoardMembers.length > 3 && (
                                <div className="h-8 w-8 rounded-lg border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                    +{activeBoardMembers.length - 3}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsInviteOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-primary px-3 sm:px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>
                </div>
            </header>

            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
            />
        </>
    );
};
