'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import toast from 'react-hot-toast';

export default function ProfilePage({ params }: { params: Promise<{ userID: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [userID, setUserID] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setUserID(resolvedParams.userID);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    if (userID) {
      loadProfile();
    }
  }, [userID]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userID}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsFollowing(data.user.isFollowing || false);
        setEditBio(data.user.bio || '');
        loadPosts(data.user.id);
        if (data.user.isOwnProfile) {
          loadLikedPosts();
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (userId: string) => {
    try {
      // Get all posts and filter by author
      const allPostsResponse = await fetch('/api/posts?filter=all');
      if (allPostsResponse.ok) {
        const data = await allPostsResponse.json();
        // Filter posts by this user
        const userPosts = data.posts.filter((p: any) => p.author.id === userId);
        setPosts(userPosts);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const loadLikedPosts = async () => {
    try {
      // Get all posts and filter by likes
      const response = await fetch('/api/posts?filter=all');
      if (response.ok) {
        const data = await response.json();
        // Filter posts that user liked
        const liked = data.posts.filter((p: any) => p.liked);
        setLikedPosts(liked);
      }
    } catch (error) {
      console.error('Failed to load liked posts:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.following);
        loadProfile(); // Reload to update counts
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: editBio }),
      });

      if (response.ok) {
        toast.success('Profile updated');
        setShowEditModal(false);
        loadProfile();
      }
    } catch (error) {
      toast.error('Failed to update profile');
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

  if (!user) {
    return (
      <div className="flex min-h-screen bg-black text-white">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">User not found</div>
      </div>
    );
  }

  const isOwnProfile = user.isOwnProfile;

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 ml-64 max-w-2xl border-x border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
            ← Back
          </button>
        </div>

        {/* Profile Header */}
        <div className="relative">
          {/* Background */}
          <div className="h-48 bg-gray-800"></div>

          {/* Avatar */}
          <div className="absolute bottom-0 left-4 transform translate-y-1/2">
            <div className="w-32 h-32 rounded-full bg-gray-700 border-4 border-black flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || ''} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>

          {/* Edit/Follow Button */}
          <div className="flex justify-end p-4">
            {isOwnProfile ? (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-6 py-2 border border-gray-700 rounded-full font-semibold hover:bg-gray-900 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                  isFollowing
                    ? 'border border-gray-700 hover:bg-gray-900'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="px-4 pb-4 mt-16">
            <h1 className="text-2xl font-bold">{user.name || 'Unknown'}</h1>
            <p className="text-gray-400">@{user.userID}</p>
            {user.bio && <p className="mt-4">{user.bio}</p>}

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <button className="hover:underline">
                <span className="font-semibold">{user._count.following}</span>{' '}
                <span className="text-gray-400">Following</span>
              </button>
              <button className="hover:underline">
                <span className="font-semibold">{user._count.followers}</span>{' '}
                <span className="text-gray-400">Followers</span>
              </button>
              <span>
                <span className="font-semibold">{user._count.posts}</span>{' '}
                <span className="text-gray-400">Posts</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-4 px-4 font-semibold transition-colors ${
              activeTab === 'posts'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Posts
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex-1 py-4 px-4 font-semibold transition-colors ${
                activeTab === 'likes'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Likes
            </button>
          )}
        </div>

        {/* Posts/Likes */}
        <div>
          {activeTab === 'posts' ? (
            posts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No posts yet</div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={session.user.id}
                  onDelete={loadProfile}
                />
              ))
            )
          ) : (
            likedPosts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No liked posts</div>
            ) : (
              likedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={session.user.id}
                />
              ))
            )
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none"
                  rows={4}
                  placeholder="Tell us about yourself"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-700 rounded-full hover:bg-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-200"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

