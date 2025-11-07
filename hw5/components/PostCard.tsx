'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatTimeAgo } from '@/lib/utils';
import { formatTextWithLinks } from '@/lib/linkify';
import { getPusherClient } from '@/lib/pusher-client';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      userID: string;
      avatar: string | null;
    };
    _count: {
      comments: number;
      likes: number;
      reposts: number;
    };
    liked?: boolean;
    reposted?: boolean;
  };
  currentUserId?: string;
  onDelete?: () => void;
}

export default function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked || false);
  const [reposted, setReposted] = useState(post.reposted || false);
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [repostCount, setRepostCount] = useState(post._count.reposts);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnPost = post.author.id === currentUserId;

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`post-${post.id}`);

    channel.bind('like-updated', (data: { count: number; liked: boolean }) => {
      setLikeCount(data.count);
      if (data.liked !== undefined) {
        setLiked(data.liked);
      }
    });

    channel.bind('repost-updated', (data: { count: number; reposted: boolean }) => {
      setRepostCount(data.count);
      if (data.reposted !== undefined) {
        setReposted(data.reposted);
      }
    });

    channel.bind('comment-added', () => {
      setCommentCount((prev) => prev + 1);
    });

    return () => {
      pusher.unsubscribe(`post-${post.id}`);
    };
  }, [post.id]);

  const handleLike = async () => {
    try {
      const response = await fetch('/api/interactions/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleRepost = async () => {
    try {
      const response = await fetch('/api/interactions/repost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle repost');
      }
    } catch (error) {
      toast.error('Failed to update repost');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast.success('Post deleted');
      if (onDelete) onDelete();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleComment = () => {
    router.push(`/post/${post.id}`);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${post.author.userID}`);
  };

  return (
    <div className="border-b border-gray-800 p-4 hover:bg-gray-900/50 transition-colors">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <button onClick={handleUserClick} className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
            {post.author.avatar ? (
              <img src={post.author.avatar} alt={post.author.name || ''} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white">
                {post.author.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <button onClick={handleUserClick} className="font-semibold hover:underline">
                {post.author.name || 'Unknown'}
              </button>
              <button onClick={handleUserClick} className="text-gray-400 hover:underline">
                @{post.author.userID}
              </button>
              <span className="text-gray-400">·</span>
              <span className="text-gray-400">{formatTimeAgo(new Date(post.createdAt))}</span>
            </div>
            {isOwnPost && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  ⋯
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="mt-2 text-white whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: formatTextWithLinks(post.content) }}
          />

          {/* Interactions */}
          <div className="flex items-center gap-6 mt-4 text-gray-400">
            <button
              onClick={handleComment}
              className="flex items-center gap-2 hover:text-blue-500 transition-colors"
            >
              <span>💬</span>
              <span>{commentCount}</span>
            </button>
            <button
              onClick={handleRepost}
              className={`flex items-center gap-2 transition-colors ${
                reposted ? 'text-green-500' : 'hover:text-green-500'
              }`}
            >
              <span>🔄</span>
              <span>{repostCount}</span>
            </button>
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition-colors ${
                liked ? 'text-red-500' : 'hover:text-red-500'
              }`}
            >
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

