'use client';

import { useState, useEffect } from 'react';

interface Draft {
  _id: string;
  content: string;
  updatedAt: string;
}

interface DraftsListProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDraft: (content: string) => void;
}

export default function DraftsList({
  isOpen,
  onClose,
  onSelectDraft,
}: DraftsListProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchDrafts();
    }
  }, [isOpen]);

  const fetchDrafts = async () => {
    try {
      const response = await fetch('/api/drafts');
      const data = await response.json();
      if (data.drafts) {
        setDrafts(data.drafts);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftID: string) => {
    try {
      const response = await fetch(`/api/drafts/${draftID}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDrafts(drafts.filter((d) => d._id !== draftID));
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[102]">
      <div
        className="bg-black border border-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Drafts</h2>
          <button
            onClick={onClose}
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
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : drafts.length === 0 ? (
            <div className="text-center text-gray-400">No drafts yet</div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft._id}
                  className="border border-gray-800 rounded-lg p-4 hover:bg-gray-900 transition-colors"
                >
                  <p className="text-white mb-2 whitespace-pre-wrap line-clamp-3">
                    {draft.content}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onSelectDraft(draft.content);
                        onClose();
                      }}
                      className="px-4 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => handleDelete(draft._id)}
                      className="px-4 py-1 border border-gray-800 text-white rounded-full text-sm hover:bg-gray-900 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

