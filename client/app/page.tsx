'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Board } from '@/components/Board';
import { useSession, signOut } from '@/lib/auth-client';
import { LayoutDashboard, Calendar, Users, Settings, Search, Bell, Sparkles, LogOut, Loader2 } from 'lucide-react';
import { useBoardStore } from '@/app/store';
import { getBoardData, ListWithCards } from '@/app/actions/board';

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { setLists, isLoaded } = useBoardStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    async function initBoard() {
      if (session?.user) {
        try {
          const data = await getBoardData();
          if (data) {
            // Map Prisma data to Store data structure
            const mappedLists = data.map((list: ListWithCards) => ({
              id: list.id,
              title: list.title,
              cards: list.cards.map((card) => ({
                id: card.id,
                content: card.content,
                priority: card.priority.toLowerCase() as any,
                deadline: card.deadline?.toISOString(),
                subtasks: (card.subtasks as any[]) || [],
              })),
            }));
            setLists(mappedLists);
          }
        } catch (error) {
          console.error('Failed to initialize board:', error);
        } finally {
          setIsInitializing(false);
        }
      }
    }

    if (session && !isLoaded) {
      initBoard();
    } else if (session) {
      setIsInitializing(false);
    }
  }, [session, setLists, isLoaded]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (isPending || (session && isInitializing)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-zinc-500 animate-pulse">Initializing Flowee...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-20 flex-col items-center border-r border-white/5 bg-zinc-950/50 py-8">
        <div className="mb-12 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <Sparkles className="h-6 w-6 text-white" />
        </div>

        <nav className="flex flex-col gap-8">
          <button className="text-primary transition-colors hover:text-primary">
            <LayoutDashboard className="h-6 w-6" />
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
          <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10">
            <img
              src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`}
              alt="User Avatar"
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b border-white/5 px-8 bg-zinc-950/20 backdrop-blur-sm">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight">
              Welcome, {session.user.name || 'User'}
            </h1>
            <p className="text-xs text-zinc-500">Your Personal Board</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="h-10 rounded-xl border border-white/5 bg-white/5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition-all focus:border-primary/50 focus:bg-white/10 w-64"
              />
            </div>
            <button className="relative rounded-xl border border-white/5 bg-white/5 p-2.5 text-zinc-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-zinc-950" />
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
              Invite
            </button>
          </div>
        </header>

        {/* Board Area */}
        <div className="flex-1 overflow-hidden bg-zinc-950/10">
          <Board />
        </div>
      </main>
    </div>
  );
}
