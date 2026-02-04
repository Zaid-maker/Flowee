'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending) {
      if (session) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [session, isPending, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-bold tracking-widest uppercase">Flowee</p>
          <p className="text-xs text-zinc-500 animate-pulse transition-all">Entering workspace...</p>
        </div>
      </div>
    </div>
  );
}
