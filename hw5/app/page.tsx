'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import InlinePostCreator from '@/components/InlinePostCreator';
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

// Component that uses useSearchParams - needs to be wrapped in Suspense
function EmailVerification() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const expectedUserID = searchParams.get('expectedUserID');
    const expectedEmail = searchParams.get('expectedEmail');
    
    if (expectedUserID && expectedEmail) {
      if (status === 'authenticated' && session?.user?.email) {
        // Verify that the logged-in email matches the expected email
        if (session.user.email.toLowerCase() !== expectedEmail.toLowerCase()) {
          console.error('❌ Email mismatch! Expected:', expectedEmail, 'Got:', session.user.email);
          // Sign out the user first, then redirect
          signOut({ redirect: false }).then(() => {
            // Clear the URL parameters
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('expectedUserID');
            newUrl.searchParams.delete('expectedEmail');
            router.replace(newUrl.pathname);
            // Redirect to signin with error
            router.push('/signin?error=EmailMismatch');
          });
          return;
        }
        
        // Email matches, clear the URL parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('expectedUserID');
        newUrl.searchParams.delete('expectedEmail');
        router.replace(newUrl.pathname);
      } else if (status === 'unauthenticated') {
        // User is not authenticated but URL has expected params, clear them
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('expectedUserID');
        newUrl.searchParams.delete('expectedEmail');
        router.replace(newUrl.pathname);
      }
    }
  }, [status, session, searchParams, router]);

  return null;
}

function HomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'following'>('all');

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
  }, [status, session, filter]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/posts?filter=${filter}`);
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
          {/* Header with filters */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800">
            <div className="flex">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-4 py-4 font-semibold transition-colors ${
                  filter === 'all'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('following')}
                className={`flex-1 px-4 py-4 font-semibold transition-colors ${
                  filter === 'following'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Following
              </button>
            </div>
          </div>

          {/* Inline Post Creator */}
          <InlinePostCreator onSuccess={fetchPosts} />

          {/* Posts Feed */}
          <div>
            {posts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                {filter === 'following'
                  ? 'No posts from people you follow yet.'
                  : 'No posts yet. Be the first to post!'}
              </div>
            ) : (
              posts.map((post) => (
                <Post key={post._id} post={post} onUpdate={fetchPosts} />
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <EmailVerification />
      <HomeContent />
    </Suspense>
  );
}
