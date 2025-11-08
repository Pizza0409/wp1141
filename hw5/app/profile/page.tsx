'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Post {
  _id: string;
  content: string;
  authorUserID: string;
  createdAt: string;
}

export default function ProfilePage() {
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
      fetchUserPosts();
    }
  }, [status, session]);

  const fetchUserPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      if (data.posts) {
        // Filter posts by current user
        const userPosts = data.posts.filter(
          (post: Post) => post.authorUserID === session?.user?.userID
        );
        setPosts(userPosts);
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
            <h1 className="text-xl font-bold text-white">Profile</h1>
          </div>

          {/* Profile Header */}
          <div className="border-b border-gray-800">
            <div className="h-48 bg-gray-800"></div>
            <div className="px-4 pb-4">
              <div className="relative -mt-16 mb-4">
                <img
                  src={session.user.image || '/default-avatar.png'}
                  alt={session.user.name || 'User'}
                  className="w-32 h-32 rounded-full border-4 border-black"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"%3E%3Ccircle cx="64" cy="64" r="64" fill="%23333"%3E%3C/svg%3E';
                  }}
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {session.user.name || 'User'}
              </h2>
              <p className="text-gray-400 mb-4">@{session.user.userID}</p>
              {session.user.email && (
                <p className="text-gray-400 text-sm mb-4">{session.user.email}</p>
              )}
            </div>
          </div>

          {/* User's Posts */}
          <div>
            <div className="border-b border-gray-800 px-4 py-4">
              <h3 className="text-lg font-semibold text-white">Posts</h3>
            </div>
            {posts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No posts yet.
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
                        <span className="font-semibold text-white">
                          @{post.authorUserID}
                        </span>
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
            <h2 className="text-xl font-bold text-white mb-4">Profile Info</h2>
            <p className="text-gray-400 text-sm">Additional profile information</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

