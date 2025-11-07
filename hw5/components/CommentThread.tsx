'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatTextWithLinks } from '@/lib/linkify';
import { formatTimeAgo } from '@/lib/utils';
import { countCharacters } from '@/lib/linkify';
import toast from 'react-hot-toast';

interface CommentThreadProps {
  postId: string;
  comments: any[];
  onCommentAdded?: () => void;
  parentId?: string | null;
  depth?: number;
}

export default function CommentThread({
  postId,
  comments,
  onCommentAdded,
  parentId = null,
  depth = 0,
}: CommentThreadProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showReply, setShowReply] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleReply = async (parentCommentId: string | null) => {
    const content = replyContent[parentCommentId || ''] || '';
    if (!content.trim()) return;

    if (countCharacters(content) > 280) {
      toast.error('Comment exceeds 280 character limit');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          content,
          parentId: parentCommentId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      toast.success('Comment posted');
      setReplyContent({ ...replyContent, [parentCommentId || '']: '' });
      if (parentCommentId) {
        setShowReply(null);
      }
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentClick = (commentId: string) => {
    router.push(`/post/${postId}/comment/${commentId}`);
  };

  if (comments.length === 0 && depth === 0) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-gray-800 rounded-lg">
          <textarea
            placeholder="Add a comment..."
            value={replyContent[''] || ''}
            onChange={(e) => setReplyContent({ ...replyContent, '': e.target.value })}
            className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none"
            rows={3}
          />
          <div className="flex items-center justify-end gap-4 mt-4">
            <div className={`text-sm ${countCharacters(replyContent[''] || '') > 280 ? 'text-red-500' : 'text-gray-400'}`}>
              {countCharacters(replyContent[''] || '')}/280
            </div>
            <button
              onClick={() => handleReply(null)}
              disabled={loading || !replyContent['']?.trim() || countCharacters(replyContent[''] || '') > 280}
              className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </div>
        <div className="text-center text-gray-400 py-8">No comments yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {depth === 0 && (
        <div className="p-4 border border-gray-800 rounded-lg">
          <textarea
            placeholder="Add a comment..."
            value={replyContent[''] || ''}
            onChange={(e) => setReplyContent({ ...replyContent, '': e.target.value })}
            className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none"
            rows={3}
          />
          <div className="flex items-center justify-end gap-4 mt-4">
            <div className={`text-sm ${countCharacters(replyContent[''] || '') > 280 ? 'text-red-500' : 'text-gray-400'}`}>
              {countCharacters(replyContent[''] || '')}/280
            </div>
            <button
              onClick={() => handleReply(null)}
              disabled={loading || !replyContent['']?.trim() || countCharacters(replyContent[''] || '') > 280}
              className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </div>
      )}

      {comments.map((comment) => (
        <div
          key={comment.id}
          className={`p-4 border border-gray-800 rounded-lg ${depth > 0 ? 'ml-8' : ''}`}
        >
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {comment.author.avatar ? (
                <img src={comment.author.avatar} alt={comment.author.name || ''} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm">
                  {comment.author.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => router.push(`/profile/${comment.author.userID}`)}
                  className="font-semibold hover:underline"
                >
                  {comment.author.name || 'Unknown'}
                </button>
                <button
                  onClick={() => router.push(`/profile/${comment.author.userID}`)}
                  className="text-gray-400 hover:underline text-sm"
                >
                  @{comment.author.userID}
                </button>
                <span className="text-gray-400">·</span>
                <span className="text-gray-400 text-sm">
                  {formatTimeAgo(new Date(comment.createdAt))}
                </span>
              </div>
              <div
                className="text-white whitespace-pre-wrap break-words mb-2"
                dangerouslySetInnerHTML={{ __html: formatTextWithLinks(comment.content) }}
              />
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <button
                  onClick={() => setShowReply(showReply === comment.id ? null : comment.id)}
                  className="hover:text-blue-500"
                >
                  Reply
                </button>
                {comment._count.replies > 0 && (
                  <button
                    onClick={() => handleCommentClick(comment.id)}
                    className="hover:text-blue-500"
                  >
                    {comment._count.replies} {comment._count.replies === 1 ? 'reply' : 'replies'}
                  </button>
                )}
              </div>

              {/* Reply form */}
              {showReply === comment.id && (
                <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                  <textarea
                    placeholder="Add a reply..."
                    value={replyContent[comment.id] || ''}
                    onChange={(e) =>
                      setReplyContent({ ...replyContent, [comment.id]: e.target.value })
                    }
                    className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none"
                    rows={3}
                  />
                  <div className="flex items-center justify-end gap-4 mt-4">
                    <div
                      className={`text-sm ${
                        countCharacters(replyContent[comment.id] || '') > 280
                          ? 'text-red-500'
                          : 'text-gray-400'
                      }`}
                    >
                      {countCharacters(replyContent[comment.id] || '')}/280
                    </div>
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={
                        loading ||
                        !replyContent[comment.id]?.trim() ||
                        countCharacters(replyContent[comment.id] || '') > 280
                      }
                      className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Nested replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4">
                  <CommentThread
                    postId={postId}
                    comments={comment.replies}
                    onCommentAdded={onCommentAdded}
                    parentId={comment.id}
                    depth={depth + 1}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

