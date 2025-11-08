'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Post from '@/components/Post';
import Comment from '@/components/Comment';
import InlinePostCreator from '@/components/InlinePostCreator';

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
  parentPostID?: string;
  authorName?: string;
  authorDisplayName?: string;
  authorImage?: string;
}

export default function PostDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const postID = params?.postID as string;
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated' && !session?.user?.userID) {
      router.push('/register-userid');
    } else if (status === 'authenticated' && postID) {
      fetchPostDetail();
    }
  }, [status, session, router, postID]);

  const fetchPostDetail = async () => {
    if (!postID) return;
    try {
      const response = await fetch(`/api/posts/${postID}`);
      const data = await response.json();
      if (response.ok) {
        setPost(data.post);
        setComments(data.comments || []);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching post detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back to previous page or home
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user?.userID || !post) {
    return null;
  }

  // Navigation title - always show "Post" as per requirements
  const navTitle = 'Post';

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="ml-64 flex">
        <main className="flex-1 max-w-2xl border-x border-gray-800">
          {/* Header with back arrow */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-4 flex items-center gap-4">
            <button
              onClick={handleBack}
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
            <h1 className="text-xl font-bold text-white">{navTitle}</h1>
          </div>

          {/* Main Post */}
          <Post post={post} onUpdate={fetchPostDetail} disableNavigation={true} />

          {/* Comment Creator */}
          <div className="border-b border-gray-800">
            <InlinePostCreator
              onSuccess={fetchPostDetail}
              parentPostID={postID}
            />
          </div>

          {/* Comments */}
          <div>
            {comments.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No comments yet.
              </div>
            ) : (
              comments.map((comment) => (
                <Comment
                  key={comment._id}
                  comment={comment}
                  onUpdate={fetchPostDetail}
                />
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar - Placeholder */}
        <aside className="w-80 p-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">Post Info</h2>
            <p className="text-gray-400 text-sm">Additional post information</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

