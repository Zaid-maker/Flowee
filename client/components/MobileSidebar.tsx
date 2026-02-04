'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    LayoutGrid,
    Calendar,
    Users,
    Settings,
    LogOut,
    Sparkles
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useBoardStore } from '@/app/store';
import { useSession, signOut } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();
    const selectBoard = useBoardStore(state => state.selectBoard);

    const handleNavigation = (path: string) => {
        if (path === '/dashboard') {
            selectBoard(null);
        }
        router.push(path);
        onClose();
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
        onClose();
    };

    const navItems = [
        { label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
        { label: 'Calendar', icon: Calendar, path: '#' },
        { label: 'Team', icon: Users, path: '#' },
        { label: 'Settings', icon: Settings, path: '#' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-sm lg:hidden"
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 z-[101] w-72 bg-zinc-950 border-r border-white/5 p-6 flex flex-col lg:hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <span className="font-bold text-white tracking-tight text-xl">Flowee</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-white transition-all"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 space-y-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => handleNavigation(item.path)}
                                    className={cn(
                                        "flex w-full items-center gap-4 px-4 py-3 rounded-2xl transition-all group",
                                        pathname === item.path
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "text-zinc-500 hover:bg-white/5 hover:text-white border border-transparent"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "h-5 w-5 transition-colors",
                                        pathname === item.path ? "text-primary" : "group-hover:text-white"
                                    )} />
                                    <span className="font-semibold text-sm">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Footer */}
                        <div className="pt-6 border-t border-white/5 space-y-6">
                            <div className="flex items-center gap-4 px-2">
                                <div className="h-12 w-12 rounded-full border-2 border-primary/20 p-0.5">
                                    <img
                                        src={session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.email}`}
                                        alt="Avatar"
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{session?.user?.name || 'User'}</p>
                                    <p className="text-[10px] text-zinc-500 truncate">{session?.user?.email}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-4 px-4 py-3 rounded-2xl text-zinc-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-transparent"
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="font-semibold text-sm">Sign Out</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
