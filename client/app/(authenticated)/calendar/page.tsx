import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getCalendarCards } from '@/app/actions/board';
import { CalendarView, CalendarCard } from './CalendarView';

export default async function CalendarPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/login');

    const raw = await getCalendarCards();

    // Serialize deadlines to ISO strings for stable client parsing.
    const cards: CalendarCard[] = (raw ?? []).map((card) => ({
        id: card.id,
        content: card.content,
        deadline: card.deadline ? card.deadline.toISOString() : '',
        board: { title: card.board.title, color: card.board.color },
    }));

    return <CalendarView initialCards={cards} />;
}
