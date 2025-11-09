'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Post from '@/components/Post';

interface PostData {
  _id: string;
  content: string;
  authorUserID: string;
  createdAt: string;
  commentCount?: number;
  repostCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  isRepost?: boolean;
  repostedBy?: string;
  authorName?: string;
  authorDisplayName?: string;
  authorImage?: string;
}

function HashtagContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const hashtag = params?.hashtag as string;
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hashtagDisplay, setHashtagDisplay] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated' && !session?.user?.userID) {
      router.push('/register-userid');
    } else if (status === 'authenticated' && hashtag) {
      fetchHashtagPosts();
    }
  }, [status, session, router, hashtag]);

  const fetchHashtagPosts = async () => {
    if (!hashtag) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/hashtag/${encodeURIComponent(hashtag)}`);
      const data = await response.json();
      if (response.ok) {
        setPosts(data.posts || []);
        setHashtagDisplay(data.hashtag || hashtag);
      } else {
        console.error('Failed to fetch hashtag posts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching hashtag posts:', error);
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
          <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-4 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-white hover:text-gray-400 transition-colors"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">#{hashtagDisplay}</h1>
                <p className="text-sm text-gray-400">{posts.length} posts</p>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div>
            {posts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No posts found with this hashtag.
              </div>
            ) : (
              posts.map((post) => (
                <Post
                  key={post._id}
                  post={post}
                  onUpdate={fetchHashtagPosts}
                />
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar - Placeholder */}
        <aside className="w-80 p-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">Hashtag Info</h2>
            <p className="text-gray-400 text-sm">
              Posts tagged with #{hashtagDisplay}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function HashtagPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <HashtagContent />
    </Suspense>
  );
}

