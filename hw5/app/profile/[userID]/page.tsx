'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
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

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userID = params?.userID as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [updatingFollow, setUpdatingFollow] = useState(false);

  const isOwnProfile = session?.user?.userID === userID;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated' && !session?.user?.userID) {
      router.push('/register-userid');
    } else if (status === 'authenticated' && userID) {
      // If viewing own profile, redirect to /profile
      if (isOwnProfile) {
        router.push('/profile');
        return;
      }
      fetchProfile();
    }
  }, [status, session, router, userID, isOwnProfile]);

  useEffect(() => {
    if (profile) {
      fetchUserPosts();
    }
  }, [profile]);

  const fetchProfile = async () => {
    if (!userID) return;
    try {
      const response = await fetch(`/api/user/${userID}`);
      const data = await response.json();
      if (response.ok) {
        setProfile(data);
        setIsFollowing(data.isFollowing || false);
      } else {
        // User not found, redirect to home
        router.push('/');
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

  const handleFollow = async () => {
    if (!profile?.userID || updatingFollow) return;
    setUpdatingFollow(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/user/${profile.userID}/follow`, {
        method,
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        // Refresh profile to update follower count
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
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
            <button
              onClick={handleFollow}
              disabled={updatingFollow}
              className={`absolute bottom-4 right-4 px-4 py-2 rounded-full font-semibold transition-colors ${
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

          {/* Posts Tab */}
          <div className="flex border-b border-gray-800">
            <button className="flex-1 px-4 py-4 font-semibold text-white border-b-2 border-blue-500">
              Posts
            </button>
          </div>

          {/* Posts */}
          <div>
            {posts.length === 0 ? (
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
    </div>
  );
}

