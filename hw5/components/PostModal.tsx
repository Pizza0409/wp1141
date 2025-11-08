'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { countCharacters } from '@/lib/utils/characterCount';
import DraftsList from './DraftsList';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
  parentPostID?: string;
  onSuccess?: () => void;
}

export default function PostModal({
  isOpen,
  onClose,
  initialContent = '',
  parentPostID,
  onSuccess,
}: PostModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setError('');
    }
  }, [isOpen, initialContent]);

  const charCount = countCharacters(content);
  const canPost = charCount.isValid && content.trim().length > 0;

  const handleClose = () => {
    if (content.trim().length > 0) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleSaveDraft = async () => {
    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        setContent('');
        setShowConfirmDialog(false);
        onClose();
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleDiscard = () => {
    setContent('');
    setShowConfirmDialog(false);
    onClose();
  };

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
        onClose();
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

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
        onClick={handleClose}
      >
        <div
          className="bg-black border border-gray-800 rounded-lg w-full max-w-2xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Drafts
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
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
                    // This prevents typing when limit is exceeded but allows deletion
                    if (newCharCount.isValid || newContent.length <= content.length) {
                      setContent(newContent);
                    }
                  }}
                  placeholder="What's happening?"
                  className="w-full bg-transparent text-white text-xl placeholder-gray-500 resize-none focus:outline-none min-h-[200px]"
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
                  <button
                    onClick={handlePost}
                    disabled={loading || !canPost}
                    type="button"
                    className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                      canPost && !loading
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[101]">
          <div className="bg-black border border-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">
              Discard post?
            </h2>
            <p className="text-gray-400 mb-6">
              This can't be undone and you'll lose your draft.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleSaveDraft}
                className="flex-1 px-4 py-2 border border-gray-800 rounded-full text-white hover:bg-gray-900 transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={handleDiscard}
                className="flex-1 px-4 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drafts List */}
      {showDrafts && (
        <DraftsList
          isOpen={showDrafts}
          onClose={() => setShowDrafts(false)}
          onSelectDraft={(draftContent) => {
            setContent(draftContent);
            setShowDrafts(false);
          }}
        />
      )}
    </>
  );
}

