import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getBoards } from '@/app/actions/board';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/login');

    const boards = await getBoards();

    return (
        <DashboardClient
            initialBoards={boards ?? []}
            currentUserId={session.user.id}
        />
    );
}
