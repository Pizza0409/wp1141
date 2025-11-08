'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface Post {
  _id: string;
  content: string;
  authorUserID: string;
  createdAt: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated' && !session?.user?.userID) {
      router.push('/register-userid');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.userID) {
      fetchPosts();
    }
  }, [status, session]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
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
      <div className="ml-64 flex">
        <main className="flex-1 max-w-2xl border-x border-gray-800">
          {/* Header */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-4">
            <h1 className="text-xl font-bold text-white">Home</h1>
          </div>

          {/* What's happening input */}
          <div className="border-b border-gray-800 p-4">
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
                <div className="text-gray-400 text-xl mb-4">
                  What's happening?
                </div>
                <button
                  onClick={() => router.push('/post')}
                  className="w-full py-3 px-4 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
                >
                  Create Post
                </button>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div>
            {posts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No posts yet. Be the first to post!
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post._id}
                  className="border-b border-gray-800 p-4 hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/profile/${post.authorUserID}`}
                          className="font-semibold text-white hover:underline"
                        >
                          @{post.authorUserID}
                        </Link>
                        <span className="text-gray-400 text-sm">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-white whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar - Placeholder */}
        <aside className="w-80 p-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">What's happening</h2>
            <p className="text-gray-400 text-sm">Trending topics will appear here</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
