'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Feed from '@/components/Feed';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.needsUserID) {
      router.push('/auth/register');
    }
  }, [status, session, router]);

  if (status === 'loading' || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Feed />
      </div>
      {/* Right sidebar placeholder */}
      <div className="hidden lg:block w-80 border-l border-gray-800 p-4">
        <div className="text-gray-400">Trends and suggestions</div>
      </div>
    </div>
  );
}
