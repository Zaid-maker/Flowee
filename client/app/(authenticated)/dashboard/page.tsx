'use client';

import { useEffect, useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { useBoardStore } from '@/app/store';
import { getBoards } from '@/app/actions/board';
import { useSession } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const selectBoard = useBoardStore(state => state.selectBoard);
    const setBoards = useBoardStore(state => state.setBoards);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        // Reset any active board selection when landing on the dashboard.
        selectBoard(null);

        let cancelled = false;
        async function fetchBoards() {
            try {
                const allBoards = await getBoards();
                if (allBoards && !cancelled) {
                    setBoards(allBoards);
                }
            } catch (error) {
                console.error('Failed to load boards:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        fetchBoards();

        return () => {
            cancelled = true;
        };
        // activeBoardId intentionally omitted to avoid a refetch loop when selectBoard(null) runs.
    }, [userId, selectBoard, setBoards]);

    if (isLoading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 opacity-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-bold uppercase tracking-widest text-white">Loading Dashboard...</p>
            </div>
        );
    }

    return <Dashboard />;
}
