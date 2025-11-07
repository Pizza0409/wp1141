'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import CommentThread from '@/components/CommentThread';
import { formatTextWithLinks } from '@/lib/linkify';
import { formatTimeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postId, setPostId] = useState<string | null>(null);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setPostId(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (postId) {
      loadPost();
      loadComments();
    }
  }, [postId]);

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/comments/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleCommentAdded = () => {
    loadComments();
    if (post) {
      setPost({
        ...post,
        _count: {
          ...post._count,
          comments: post._count.comments + 1,
        },
      });
    }
  };

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">Post not found</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 ml-64 max-w-2xl border-x border-gray-800">
        {/* Back button */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </button>
        </div>

        {/* Post */}
        <div className="p-4 border-b border-gray-800">
          <PostCard
            post={post}
            currentUserId={session.user.id}
            onDelete={() => router.push('/home')}
          />
        </div>

        {/* Comments */}
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Comments</h2>
          <CommentThread
            postId={post.id}
            comments={comments}
            onCommentAdded={handleCommentAdded}
          />
        </div>
      </div>
    </div>
  );
}

