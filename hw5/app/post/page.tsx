'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function PostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated' && !session?.user?.userID) {
      router.push('/register-userid');
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!content.trim()) {
      setError('Post content cannot be empty');
      setLoading(false);
      return;
    }

    if (content.length > 280) {
      setError('Post must be 280 characters or less');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create post');
        setLoading(false);
        return;
      }

      // Success - redirect to home
      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user?.userID) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="ml-64 flex justify-center">
        <main className="flex-1 max-w-2xl border-x border-gray-800">
          {/* Header */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Create Post</h1>
          </div>

          {/* Post Form */}
          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={session.user.image || '/default-avatar.png'}
                  alt={session.user.name || 'User'}
                  className="w-12 h-12 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23333"%3E%3C/svg%3E';
                  }}
                />
                <div className="flex-1">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's happening?"
                    className="w-full bg-transparent text-white text-xl placeholder-gray-500 resize-none focus:outline-none min-h-[200px]"
                    maxLength={280}
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                    <span
                      className={`text-sm ${
                        content.length > 260
                          ? 'text-red-400'
                          : content.length > 240
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {content.length}/280
                    </span>
                    <button
                      type="submit"
                      disabled={loading || !content.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

