'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Board } from '@/components/Board';
import { Dashboard } from '@/components/Dashboard';
import { useSession, signOut } from '@/lib/auth-client';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Search,
  Bell,
  Sparkles,
  LogOut,
  Loader2,
  LayoutGrid,
  ChevronLeft
} from 'lucide-react';
import { useBoardStore } from '@/app/store';
import { getBoardData, getBoards, ListWithCards } from '@/app/actions/board';

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const {
    boards,
    setBoards,
    activeBoardId,
    selectBoard,
    setLists,
    isLoaded
  } = useBoardStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isFetchingBoard, setIsFetchingBoard] = useState(false);

  // Auth Redirect
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  // Initial Fetch: Load all boards
  useEffect(() => {
    async function initWorkspace() {
      if (session?.user) {
        try {
          const allBoards = await getBoards();
          if (allBoards) {
            setBoards(allBoards);
          }
        } catch (error) {
          console.error('Failed to load workspace:', error);
        } finally {
          setIsInitializing(false);
        }
      }
    }
    if (session) initWorkspace();
  }, [session, setBoards]);

  // Board Data Switcher
  useEffect(() => {
    async function fetchActiveBoard() {
      if (session?.user && activeBoardId && !isLoaded) {
        setIsFetchingBoard(true);
        try {
          const data = await getBoardData(activeBoardId);
          if (data) {
            const mappedLists = data.map((list: ListWithCards) => ({
              id: list.id,
              title: list.title,
              cards: list.cards.map((card) => ({
                id: card.id,
                content: card.content,
                description: card.description || '',
                priority: card.priority.toLowerCase() as any,
                deadline: card.deadline?.toISOString(),
                subtasks: (card.subtasks as any[]) || [],
              })),
            }));
            setLists(mappedLists);
          }
        } catch (error) {
          console.error('Failed to load board data:', error);
        } finally {
          setIsFetchingBoard(false);
        }
      }
    }
    fetchActiveBoard();
  }, [session, activeBoardId, isLoaded, setLists]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (isPending || (session && isInitializing)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-bold tracking-widest uppercase">Flowee</p>
            <p className="text-xs text-zinc-500 animate-pulse transition-all">Setting up your creative workspace...</p>
          </div>
        </div>
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
          onClick={() => selectBoard(null)}
          className="mb-12 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 cursor-pointer hover:scale-105 transition-all"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </div>

        <nav className="flex flex-col gap-8">
          <button
            onClick={() => selectBoard(null)}
            className={activeBoardId === null ? "text-primary" : "text-zinc-500 hover:text-white transition-colors"}
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
                onClick={() => selectBoard(null)}
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
            <button className="relative rounded-xl border border-white/5 bg-white/5 p-2.5 text-zinc-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-zinc-950" />
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
              Share
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-zinc-950/10">
          {activeBoardId ? (
            isFetchingBoard ? (
              <div className="h-full w-full flex flex-col items-center justify-center gap-4 opacity-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-bold uppercase tracking-widest">Opening board...</p>
              </div>
            ) : (
              <Board key={activeBoardId} />
            )
          ) : (
            <Dashboard />
          )}
        </div>

        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      </main>
    </div>
  );
}
