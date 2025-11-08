'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface Post {
  _id: string;
  content: string;
  authorUserID: string;
  createdAt: string;
  isRepost?: boolean;
  repostedBy?: string;
}

interface UserProfile {
  userID: string;
  name: string;
  displayName?: string;
  bio?: string;
  image?: string;
  backgroundImage?: string;
  following: number;
  followers: number;
  postCount: number;
  isFollowing?: boolean;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likes, setLikes] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editBackgroundImage, setEditBackgroundImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [updatingFollow, setUpdatingFollow] = useState(false);

  // On /profile route, it's always the user's own profile
  // Once profile loads, verify it matches the session userID
  const isOwnProfile = profile ? session?.user?.userID === profile?.userID : true;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated' && !session?.user?.userID) {
      router.push('/register-userid');
    } else if (status === 'authenticated' && session?.user?.userID) {
      fetchProfile();
    }
  }, [status, session, router]);

  useEffect(() => {
    if (profile) {
      fetchUserPosts();
      if (isOwnProfile) {
        fetchUserLikes();
      }
    }
  }, [profile, isOwnProfile]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showEditModal) {
        setShowEditModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showEditModal]);

  const fetchProfile = async () => {
    if (!session?.user?.userID) return;
    try {
      const response = await fetch(`/api/user/${session.user.userID}`);
      const data = await response.json();
      if (response.ok) {
        setProfile(data);
        setIsFollowing(data.isFollowing || false);
        setEditDisplayName(data.displayName || '');
        setEditBio(data.bio || '');
        setEditBackgroundImage(data.backgroundImage || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    if (!profile?.userID) return;
    try {
      const response = await fetch(`/api/user/${profile.userID}/posts`);
      const data = await response.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchUserLikes = async () => {
    if (!profile?.userID || !isOwnProfile) return;
    try {
      const response = await fetch(`/api/user/${profile.userID}/likes`);
      const data = await response.json();
      if (data.posts) {
        setLikes(data.posts);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.userID) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/user/${profile.userID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editDisplayName.trim() || undefined,
          bio: editBio.trim() || undefined,
          backgroundImage: editBackgroundImage.trim() || undefined,
        }),
      });

      if (response.ok) {
        await fetchProfile();
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!profile?.userID || updatingFollow) return;
    setUpdatingFollow(true);
    
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      console.log(`Attempting to ${isFollowing ? 'unfollow' : 'follow'} user:`, profile.userID);
      
      const response = await fetch(`/api/user/${profile.userID}/follow`, {
        method,
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Follow action successful:', data);
        setIsFollowing(!isFollowing);
        // Refresh profile to update follower count
        await fetchProfile();
      } else {
        console.error('Follow action failed:', data);
        alert(data.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setUpdatingFollow(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user?.userID || !profile) {
    return null;
  }

  const displayName = profile.displayName || profile.name;

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <div className="ml-64 flex">
        <main className="flex-1 max-w-2xl border-x border-gray-800">
          {/* Header with back arrow */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-4 flex items-center gap-4">
            <Link href="/" className="text-white hover:text-gray-400 transition-colors">
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{displayName}</h1>
              <p className="text-gray-400 text-sm">{profile.postCount} posts</p>
            </div>
          </div>

          {/* Background Image */}
          <div className="relative h-48 bg-gray-800">
            {profile.backgroundImage ? (
              <img
                src={profile.backgroundImage}
                alt="Background"
                className="w-full h-full object-cover"
              />
            ) : null}
            {isOwnProfile && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Edit Profile button clicked');
                  setShowEditModal(true);
                }}
                className="absolute bottom-4 right-4 bg-white text-black px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors z-10"
                type="button"
              >
                Edit Profile
              </button>
            )}
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                disabled={updatingFollow}
                type="button"
                className={`absolute bottom-4 right-4 px-4 py-2 rounded-full font-semibold transition-colors z-10 ${
                  isFollowing
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {updatingFollow
                  ? '...'
                  : isFollowing
                  ? 'Following'
                  : 'Follow'}
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="px-4 pb-4 border-b border-gray-800">
            <div className="relative -mt-16 mb-4">
              <img
                src={profile.image || '/default-avatar.png'}
                alt={displayName}
                className="w-32 h-32 rounded-full border-4 border-black"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"%3E%3Ccircle cx="64" cy="64" r="64" fill="%23333"%3E%3C/svg%3E';
                }}
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{displayName}</h2>
            <p className="text-gray-400 mb-2">@{profile.userID}</p>
            {profile.bio && (
              <p className="text-white mb-4 whitespace-pre-wrap">{profile.bio}</p>
            )}
            <div className="flex gap-4 text-sm">
              <span className="text-white">
                <span className="font-semibold">{profile.following}</span>{' '}
                <span className="text-gray-400">Following</span>
              </span>
              <span className="text-white">
                <span className="font-semibold">{profile.followers}</span>{' '}
                <span className="text-gray-400">Followers</span>
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-4 py-4 font-semibold transition-colors ${
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
                className={`flex-1 px-4 py-4 font-semibold transition-colors ${
                  activeTab === 'likes'
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Likes
              </button>
            )}
          </div>

          {/* Posts or Likes */}
          <div>
            {activeTab === 'posts' ? (
              posts.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No posts yet.
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="border-b border-gray-800 p-4 hover:bg-gray-900/50 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link
                            href={`/profile/${post.authorUserID}`}
                            className="font-semibold text-white hover:underline"
                          >
                            @{post.authorUserID}
                          </Link>
                          {post.isRepost && post.repostedBy && (
                            <span className="text-gray-400 text-sm">
                              (reposted by{' '}
                              <Link
                                href={`/profile/${post.repostedBy}`}
                                className="text-blue-400 hover:underline"
                              >
                                @{post.repostedBy}
                              </Link>
                              )
                            </span>
                          )}
                          <span className="text-gray-400 text-sm">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              likes.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No likes yet.
                </div>
              ) : (
                likes.map((post) => (
                  <div
                    key={post._id}
                    className="border-b border-gray-800 p-4 hover:bg-gray-900/50 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link
                            href={`/profile/${post.authorUserID}`}
                            className="font-semibold text-white hover:underline"
                          >
                            @{post.authorUserID}
                          </Link>
                          <span className="text-gray-400 text-sm">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </main>

        {/* Right Sidebar - Placeholder */}
        <aside className="w-80 p-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <h2 className="text-xl font-bold text-white mb-4">Profile Info</h2>
            <p className="text-gray-400 text-sm">Additional profile information</p>
          </div>
        </aside>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
          onClick={() => {
            console.log('Modal backdrop clicked');
            setShowEditModal(false);
          }}
        >
          <div
            className="bg-black border border-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-white mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">Display Name</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder={profile.name}
                />
              </div>
              <div>
                <label className="block text-white mb-2">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  rows={4}
                  placeholder="Tell us about yourself"
                  maxLength={160}
                />
                <p className="text-gray-400 text-sm mt-1">
                  {editBio.length}/160
                </p>
              </div>
              <div>
                <label className="block text-white mb-2">Background Image URL</label>
                <input
                  type="text"
                  value={editBackgroundImage}
                  onChange={(e) => setEditBackgroundImage(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-800 rounded-full text-white hover:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
