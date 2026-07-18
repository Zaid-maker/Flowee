'use client';

import { useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { useBoardStore, Board } from '@/app/store';

interface DashboardClientProps {
    initialBoards: Board[];
    currentUserId: string;
}

export function DashboardClient({ initialBoards, currentUserId }: DashboardClientProps) {
    // Seed the store synchronously before children render (runs once per mount).
    useState(() => {
        useBoardStore.setState({
            boards: initialBoards,
            activeBoardId: null,
            lists: [],
            isLoaded: false,
        });
        return null;
    });

    return <Dashboard currentUserId={currentUserId} />;
}
