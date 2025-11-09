'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { parseText } from '@/lib/utils/textParser';
import { formatTime } from '@/lib/utils/timeFormat';

interface PostProps {
  post: {
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
  };
  showActions?: boolean;
  onUpdate?: () => void;
  disableNavigation?: boolean; // If true, clicking post won't navigate
}

export default function Post({ post, showActions = true, onUpdate, disableNavigation = false }: PostProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnPost = session?.user?.userID === post.authorUserID;
  const parsedContent = parseText(post.content);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.userID) return;

    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikeCount((prev) => (data.isLiked ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.userID) return;

    try {
      const response = await fetch(`/api/posts/${post._id}/repost`, {
        method: 'POST',
      });

      if (response.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error reposting:', error);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/post/${post._id}`);
  };

  const handleDelete = async () => {
    if (!isOwnPost || post.isRepost) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
      });

      if (response.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteMenu(false);
    }
  };

  const handlePostClick = () => {
    if (disableNavigation) return;
    // Only navigate if clicking on the post itself, not on action buttons
    // This allows recursive navigation for comments
    router.push(`/post/${post._id}`);
  };

  return (
    <div
      className={`border-b border-gray-800 p-4 hover:bg-gray-900/50 transition-colors ${
        disableNavigation ? '' : 'cursor-pointer'
      }`}
      onClick={handlePostClick}
    >
      <div className="flex gap-4">
        {/* Author Avatar */}
        <Link
          href={`/profile/${post.authorUserID}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        >
          <img
            src={post.authorImage || '/default-avatar.png'}
            alt={post.authorDisplayName || post.authorUserID}
            className="w-12 h-12 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23333"%3E%3C/svg%3E';
            }}
          />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/profile/${post.authorUserID}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-white hover:underline"
            >
              @{post.authorUserID}
            </Link>
            {post.isRepost && post.repostedBy && (
              <span className="text-gray-400 text-sm">
                (reposted by{' '}
                <Link
                  href={`/profile/${post.repostedBy}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-400 hover:underline"
                >
                  @{post.repostedBy}
                </Link>
                )
              </span>
            )}
            <span className="text-gray-400 text-sm">
              {formatTime(post.createdAt)}
            </span>
            {isOwnPost && !post.isRepost && (
              <div className="relative ml-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteMenu(!showDeleteMenu);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>
                {showDeleteMenu && (
                  <div className="absolute right-0 top-8 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 transition-colors"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-white whitespace-pre-wrap">
            {parsedContent.map((part, index) => {
              if (part.type === 'text') {
                return <span key={index}>{part.content}</span>;
              } else if (part.type === 'link') {
                return (
                  <a
                    key={index}
                    href={part.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-400 hover:underline"
                  >
                    {part.content}
                  </a>
                );
              } else if (part.type === 'hashtag') {
                return (
                  <Link
                    key={index}
                    href={part.href || '#'}
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-400 hover:underline"
                  >
                    {part.content}
                  </Link>
                );
              } else if (part.type === 'mention') {
                return (
                  <Link
                    key={index}
                    href={part.href || '#'}
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-400 hover:underline"
                  >
                    {part.content}
                  </Link>
                );
              }
              return null;
            })}
          </div>
          {showActions && (
            <div className="flex items-center gap-6 mt-4 text-gray-400">
              <button
                onClick={handleComment}
                className="flex items-center gap-2 hover:text-blue-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>{post.commentCount || 0}</span>
              </button>
              <button
                onClick={handleRepost}
                className="flex items-center gap-2 hover:text-green-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{post.repostCount || 0}</span>
              </button>
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${
                  isLiked
                    ? 'text-red-500 hover:text-red-600'
                    : 'hover:text-red-400'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill={isLiked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{likeCount}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

