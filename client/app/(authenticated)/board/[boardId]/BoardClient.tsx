'use client';

import { useState } from 'react';
import { Board } from '@/components/Board';
import { useBoardStore, Board as BoardType, List, BoardMember } from '@/app/store';

interface BoardClientProps {
    boardId: string;
    initialBoard: BoardType;
    initialLists: List[];
    initialMembers: BoardMember[];
}

export function BoardClient({ boardId, initialBoard, initialLists, initialMembers }: BoardClientProps) {
    // Seed the store synchronously before <Board /> renders (runs once per mount;
    // the parent server component keys this component by boardId so switching
    // boards remounts and re-seeds).
    useState(() => {
        const existing = useBoardStore.getState().boards;
        const boards = existing.some(b => b.id === initialBoard.id)
            ? existing.map(b => (b.id === initialBoard.id ? initialBoard : b))
            : [initialBoard, ...existing];

        useBoardStore.setState({
            boards,
            activeBoardId: boardId,
            lists: initialLists,
            isLoaded: true,
            activeBoardMembers: initialMembers,
        });
        return null;
    });

    return <Board key={boardId} />;
}
