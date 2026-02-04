'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import {
    Calendar,
    Users,
    Settings,
    Sparkles,
    LogOut,
    Loader2,
    LayoutGrid
} from 'lucide-react';
import { useBoardStore } from '@/app/store';
import { MobileSidebar } from '@/components/MobileSidebar';
import { Navbar } from '@/components/Navbar';

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending } = useSession();
    const userId = session?.user?.id;

    const selectBoard = useBoardStore(state => state.selectBoard);
    const fetchInvites = useBoardStore(state => state.fetchInvites);

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
        setIsMobileSidebarOpen(false);
    };

    if (isPending) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background text-white">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground tracking-tight">
            <MobileSidebar
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-20 flex-col items-center border-r border-white/5 bg-zinc-950/50 py-8 relative z-[20]">
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

            {/* Main Content Area */}
            <main className="flex flex-1 flex-col overflow-hidden relative">
                <Navbar
                    onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
                    onDashboardClick={handleDashboardClick}
                />

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-zinc-950/10">
                    {children}
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            </main>
        </div>
    );
}
