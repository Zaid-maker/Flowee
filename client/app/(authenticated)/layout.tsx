'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import {
    Calendar,
    Users,
    Settings,
    Search,
    Sparkles,
    LogOut,
    Loader2,
    LayoutGrid,
    ChevronLeft
} from 'lucide-react';
import { useBoardStore } from '@/app/store';
import { NotificationCenter } from '@/components/NotificationCenter';
import { InviteModal } from '@/components/InviteModal';

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending } = useSession();
    const userId = session?.user?.id;

    const boards = useBoardStore(state => state.boards);
    const activeBoardId = useBoardStore(state => state.activeBoardId);
    const activeBoardMembers = useBoardStore(state => state.activeBoardMembers);
    const selectBoard = useBoardStore(state => state.selectBoard);
    const fetchInvites = useBoardStore(state => state.fetchInvites);

    const [isInviteOpen, setIsInviteOpen] = useState(false);

    // Auth Redirect
    useEffect(() => {
        if (!isPending && !session) {
            router.push('/login');
        }
    }, [session, isPending, router]);

    useEffect(() => {
        if (userId) {
            fetchInvites();
        }
    }, [userId, fetchInvites]);

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    const handleDashboardClick = () => {
        selectBoard(null);
        router.push('/dashboard');
    };

    if (isPending) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background text-white">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) return null;

    const activeBoard = boards.find(b => b.id === activeBoardId);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground tracking-tight">
            {/* Sidebar */}
            <aside className="flex w-20 flex-col items-center border-r border-white/5 bg-zinc-950/50 py-8 relative z-[20]">
                <div
                    onClick={handleDashboardClick}
                    className="mb-12 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-white/5 shadow-lg cursor-pointer hover:scale-105 transition-all overflow-hidden"
                >
                    <img src="/assets/logo.png" alt="Flowee Logo" className="h-full w-full object-cover p-2" />
                </div>

                <nav className="flex flex-col gap-8">
                    <button
                        onClick={handleDashboardClick}
                        className={pathname === "/dashboard" ? "text-primary" : "text-zinc-500 hover:text-white transition-colors"}
                        title="Dashboard"
                    >
                        <LayoutGrid className="h-6 w-6" />
                    </button>
                    <button className="text-zinc-500 transition-colors hover:text-white">
                        <Calendar className="h-6 w-6" />
                    </button>
                    <button className="text-zinc-500 transition-colors hover:text-white">
                        <Users className="h-6 w-6" />
                    </button>
                    <button className="text-zinc-500 transition-colors hover:text-white">
                        <Settings className="h-6 w-6" />
                    </button>
                </nav>

                <div className="mt-auto flex flex-col items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="text-zinc-500 transition-colors hover:text-rose-500"
                        title="Sign out"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 ring-2 ring-primary/20 ring-offset-2 ring-offset-zinc-950">
                        <img
                            src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`}
                            alt="User Avatar"
                        />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex flex-1 flex-col overflow-hidden relative">
                {/* Header */}
                <header className="flex h-20 items-center justify-between border-b border-white/5 px-8 bg-zinc-950/20 backdrop-blur-md relative z-[10]">
                    <div className="flex items-center gap-4">
                        {activeBoardId && (
                            <button
                                onClick={handleDashboardClick}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all mr-2"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                                {activeBoardId ? activeBoard?.title : `Welcome, ${session.user.name || 'User'}`}
                            </h1>
                            <p className="text-xs font-medium text-zinc-500 tracking-wide uppercase">
                                {activeBoardId ? 'Board Interface' : 'Personal Dashboard'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Universal search..."
                                className="h-10 rounded-xl border border-white/5 bg-white/5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition-all focus:border-primary/50 focus:bg-white/10 w-64"
                            />
                        </div>
                        <NotificationCenter />

                        <div className="flex -space-x-2 mr-2">
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
                            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                        >
                            Share
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-zinc-950/10">
                    {children}
                </div>

                <InviteModal
                    isOpen={isInviteOpen}
                    onClose={() => setIsInviteOpen(false)}
                />

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            </main>
        </div>
    );
}
