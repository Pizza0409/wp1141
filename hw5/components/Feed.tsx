'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PostCard from './PostCard';
import PostModal from './PostModal';
import { useSearchParams } from 'next/navigation';

export default function Feed() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [expandedComposer, setExpandedComposer] = useState(false);
  const [composerContent, setComposerContent] = useState('');

  useEffect(() => {
    const postParam = searchParams.get('post');
    if (postParam === 'true') {
      setShowPostModal(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSuccess = () => {
    loadPosts();
  };

  const handleInlinePost = async () => {
    if (!composerContent.trim()) return;

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: composerContent }),
      });

      if (response.ok) {
        setComposerContent('');
        setExpandedComposer(false);
        loadPosts();
      }
    } catch (error) {
      console.error('Failed to post:', error);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto border-x border-gray-800 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 z-10">
        <div className="flex">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-4 px-4 font-semibold transition-colors ${
              filter === 'all'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`flex-1 py-4 px-4 font-semibold transition-colors ${
              filter === 'following'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Inline Composer */}
      <div className="p-4 border-b border-gray-800">
        {!expandedComposer ? (
          <button
            onClick={() => setExpandedComposer(true)}
            className="w-full text-left text-gray-400 p-4 rounded-lg hover:bg-gray-900 transition-colors"
          >
            What's happening?
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {session.user.image ? (
                  <img src={session.user.image} alt={session.user.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={composerContent}
                  onChange={(e) => setComposerContent(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-lg"
                  rows={4}
                  onFocus={() => setExpandedComposer(true)}
                />
                <div className="mt-2 text-sm text-gray-400">Everyone can reply</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => {
                  setExpandedComposer(false);
                  setComposerContent('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleInlinePost}
                disabled={!composerContent.trim()}
                className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-gray-400">No posts yet</div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={session.user.id}
              onDelete={loadPosts}
            />
          ))}
        </div>
      )}

      {/* Post Modal */}
      <PostModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onPost={handlePostSuccess}
      />
    </div>
  );
}

