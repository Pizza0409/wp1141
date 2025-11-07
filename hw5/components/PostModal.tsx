'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { countCharacters } from '@/lib/linkify';
import toast from 'react-hot-toast';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
  onPost?: () => void;
}

export default function PostModal({ isOpen, onClose, initialContent = '', onPost }: PostModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [charCount, setCharCount] = useState(0);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      loadDrafts();
    }
  }, [isOpen, initialContent]);

  useEffect(() => {
    setCharCount(countCharacters(content));
  }, [content]);

  const loadDrafts = async () => {
    try {
      const response = await fetch('/api/drafts');
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts || []);
      }
    } catch (error) {
      console.error('Failed to load drafts:', error);
    }
  };

  const handlePost = async () => {
    if (charCount > 280) {
      toast.error('Post exceeds 280 character limit');
      return;
    }

    if (!content.trim()) {
      toast.error('Post cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post');
      }

      toast.success('Post created!');
      setContent('');
      onClose();
      if (onPost) onPost();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      toast.error('Draft cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      toast.success('Draft saved');
      setContent('');
      onClose();
      loadDrafts();
    } catch (error) {
      toast.error('Failed to save draft');
    }
  };

  const handleDiscard = () => {
    if (content.trim()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmDiscard = () => {
    setContent('');
    setShowDiscardConfirm(false);
    onClose();
  };

  const loadDraft = (draftContent: string) => {
    setContent(draftContent);
    setShowDrafts(false);
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const response = await fetch(`/api/drafts/${draftId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Draft deleted');
        loadDrafts();
      }
    } catch (error) {
      toast.error('Failed to delete draft');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button
            onClick={handleDiscard}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
          <button
            onClick={() => setShowDrafts(!showDrafts)}
            className="text-blue-500 hover:text-blue-400 transition-colors"
          >
            Drafts
          </button>
        </div>

        {/* Drafts List */}
        {showDrafts && (
          <div className="border-b border-gray-800 max-h-64 overflow-y-auto">
            {drafts.length === 0 ? (
              <div className="p-4 text-gray-400 text-center">No drafts</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {drafts.map((draft) => (
                  <div key={draft.id} className="p-4 hover:bg-gray-900 flex items-center justify-between">
                    <button
                      onClick={() => loadDraft(draft.content)}
                      className="flex-1 text-left text-sm text-gray-300 hover:text-white"
                    >
                      {draft.content.substring(0, 100)}
                      {draft.content.length > 100 && '...'}
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      className="ml-4 text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {session?.user?.image ? (
                <img src={session.user.image} alt={session.user.name || ''} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening?"
                className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-lg"
                rows={6}
              />
              <div className="mt-4 text-sm text-gray-400">
                Everyone can reply
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between">
          <div className="flex gap-4 text-blue-500">
            {/* Icons placeholder - can add image, GIF, poll, emoji, schedule, location */}
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-sm ${charCount > 280 ? 'text-red-500' : 'text-gray-400'}`}>
              {charCount}/280
            </div>
            <button
              onClick={handlePost}
              disabled={loading || charCount > 280 || !content.trim()}
              className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Discard Confirmation */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4">Discard post?</h3>
            <p className="text-gray-400 mb-6">This can't be undone and you'll lose your draft.</p>
            <div className="flex gap-4">
              <button
                onClick={handleSaveDraft}
                className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                Save draft
              </button>
              <button
                onClick={confirmDiscard}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

