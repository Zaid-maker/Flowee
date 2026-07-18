import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getBoard, getBoardData } from '@/app/actions/board';
import { getBoardMembers } from '@/app/actions/collaboration';
import { List, Priority, Subtask, BoardMember } from '@/app/store';
import { BoardClient } from './BoardClient';

export default async function BoardPage({
    params,
}: {
    params: Promise<{ boardId: string }>;
}) {
    const { boardId } = await params;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/login');

    const [board, data] = await Promise.all([getBoard(boardId), getBoardData(boardId)]);

    // No access / not found -> back to the dashboard.
    if (!board || !data) redirect('/dashboard');

    const members = await getBoardMembers(boardId).catch(() => []);

    const initialLists: List[] = data.map((list) => ({
        id: list.id,
        title: list.title,
        cards: list.cards.map((card) => ({
            id: card.id,
            content: card.content,
            description: card.description || '',
            priority: card.priority.toLowerCase() as Priority,
            deadline: card.deadline ? card.deadline.toISOString() : null,
            subtasks: (card.subtasks as unknown as Subtask[]) || [],
        })),
    }));

    return (
        <BoardClient
            key={boardId}
            boardId={boardId}
            initialBoard={board}
            initialLists={initialLists}
            initialMembers={(members ?? []) as unknown as BoardMember[]}
        />
    );
}
