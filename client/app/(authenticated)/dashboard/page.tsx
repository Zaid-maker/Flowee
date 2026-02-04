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
    const activeBoardId = useBoardStore(state => state.activeBoardId);
    const setBoards = useBoardStore(state => state.setBoards);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (activeBoardId !== null) {
            selectBoard(null);
        }
        async function fetchBoards() {
            if (userId) {
                try {
                    const allBoards = await getBoards();
                    if (allBoards) {
                        setBoards(allBoards);
                    }
                } catch (error) {
                    console.error('Failed to load boards:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        }
        fetchBoards();
    }, [userId, selectBoard, setBoards, activeBoardId]);

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
