import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) redirect('/login');

    return (
        <AppShell
            user={{
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
            }}
        >
            {children}
        </AppShell>
    );
}
