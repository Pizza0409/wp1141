'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { countCharacters } from '@/lib/utils/characterCount';

interface InlinePostCreatorProps {
  onSuccess?: () => void;
  parentPostID?: string;
}

export default function InlinePostCreator({ onSuccess, parentPostID }: InlinePostCreatorProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const charCount = countCharacters(content);
  const canPost = charCount.isValid && content.trim().length > 0;

  const handlePost = async () => {
    if (!canPost) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), parentPostID }),
      });

      if (response.ok) {
        setContent('');
        setIsExpanded(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create post');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="border-b border-gray-800 p-4">
        <div className="flex gap-4">
          <img
            src={session?.user?.image || '/default-avatar.png'}
            alt={session?.user?.name || 'User'}
            className="w-12 h-12 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23333"%3E%3C/svg%3E';
            }}
          />
          <div
            className="flex-1 text-gray-400 text-xl cursor-text"
            onClick={() => setIsExpanded(true)}
          >
            What's happening?
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-800 p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <img
          src={session?.user?.image || '/default-avatar.png'}
          alt={session?.user?.name || 'User'}
          className="w-12 h-12 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23333"%3E%3C/svg%3E';
          }}
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => {
              const newContent = e.target.value;
              const newCharCount = countCharacters(newContent);
              // Allow input if valid, or if deleting (new length <= old length)
              if (newCharCount.isValid || newContent.length <= content.length) {
                setContent(newContent);
              }
            }}
            placeholder="What's happening?"
            className="w-full bg-transparent text-white text-xl placeholder-gray-500 resize-none focus:outline-none min-h-[100px]"
            autoFocus
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <span
              className={`text-sm ${
                charCount.totalCount > 260
                  ? 'text-red-400'
                  : charCount.totalCount > 240
                  ? 'text-yellow-400'
                  : 'text-gray-400'
              }`}
            >
              {charCount.totalCount}/280
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setContent('');
                  setError('');
                }}
                className="px-4 py-2 border border-gray-800 rounded-full text-white hover:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={loading || !canPost}
                className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

