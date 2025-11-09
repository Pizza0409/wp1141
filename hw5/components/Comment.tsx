'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { parseText } from '@/lib/utils/textParser';
import { formatTime } from '@/lib/utils/timeFormat';

interface CommentProps {
  comment: {
    _id: string;
    content: string;
    authorUserID: string;
    createdAt: string;
    commentCount?: number;
    repostCount?: number;
    likeCount?: number;
    isLiked?: boolean;
    authorName?: string;
    authorDisplayName?: string;
    authorImage?: string;
  };
  onUpdate?: () => void;
}

export default function Comment({ comment, onUpdate }: CommentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnComment = session?.user?.userID === comment.authorUserID;
  const parsedContent = parseText(comment.content);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user?.userID) return;

    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${comment._id}/like`, {
        method,
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error liking/unliking comment:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${comment._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onUpdate?.();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete comment: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('An error occurred while deleting the comment.');
    } finally {
      setIsDeleting(false);
      setShowDeleteMenu(false);
    }
  };

  const handleCommentClick = () => {
    router.push(`/post/${comment._id}`);
  };

  return (
    <div
      className="border-b border-gray-800 px-4 py-3 hover:bg-gray-900/30 transition-colors cursor-pointer"
      onClick={handleCommentClick}
    >
      <div className="flex gap-3">
        {/* Author Avatar - Smaller for comments */}
        <Link
          href={`/profile/${comment.authorUserID}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        >
          <img
            src={comment.authorImage || '/default-avatar.png'}
            alt={comment.authorDisplayName || comment.authorUserID}
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%23333"%3E%3C/svg%3E';
            }}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/profile/${comment.authorUserID}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-white hover:underline text-sm"
            >
              @{comment.authorUserID}
            </Link>
            <span className="text-gray-400 text-xs">
              {formatTime(comment.createdAt)}
            </span>
            {isOwnComment && (
              <div className="relative ml-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteMenu(!showDeleteMenu);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-4 h-4"
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
                  <div className="absolute right-0 top-6 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-10">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800 transition-colors"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-white text-sm whitespace-pre-wrap mb-2">
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
          <div className="flex items-center gap-4 text-gray-400 text-xs">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${
                isLiked
                  ? 'text-red-500 hover:text-red-600'
                  : 'hover:text-red-400'
              }`}
            >
              <svg
                className="w-4 h-4"
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
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            {comment.commentCount !== undefined && comment.commentCount > 0 && (
              <span className="text-gray-500">
                {comment.commentCount} {comment.commentCount === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

