'use client';

import { useEffect, useState, use } from 'react';
import { Board } from '@/components/Board';
import { useBoardStore } from '@/app/store';
import { getBoardData, ListWithCards } from '@/app/actions/board';
import { useSession } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function BoardPage() {
    const params = useParams();
    const boardId = params.boardId as string;

    const { data: session } = useSession();
    const userId = session?.user?.id;

    const activeBoardId = useBoardStore(state => state.activeBoardId);
    const isLoaded = useBoardStore(state => state.isLoaded);
    const selectBoard = useBoardStore(state => state.selectBoard);
    const setLists = useBoardStore(state => state.setLists);
    const fetchBoardMembers = useBoardStore(state => state.fetchBoardMembers);

    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (boardId && boardId !== activeBoardId) {
            selectBoard(boardId);
        }
    }, [boardId, activeBoardId, selectBoard]);

    useEffect(() => {
        async function fetchBoard() {
            if (userId && boardId && (!isLoaded || activeBoardId !== boardId)) {
                setIsFetching(true);
                try {
                    const data = await getBoardData(boardId);
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
                    console.error('Failed to load board:', error);
                } finally {
                    setIsFetching(false);
                }
            }
        }

        if (boardId) {
            fetchBoard();
            fetchBoardMembers();
        }
    }, [userId, boardId, activeBoardId, isLoaded, setLists, fetchBoardMembers]);

    if (isFetching) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 opacity-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-bold uppercase tracking-widest text-white">Opening board...</p>
            </div>
        );
    }

    return <Board key={boardId} />;
}
