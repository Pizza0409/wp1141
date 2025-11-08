'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/signin' });
  };

  const handlePostClick = () => {
    router.push('/post');
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-black border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-4">
        <Link href="/" className="text-2xl font-bold text-white">
          X
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        <Link
          href="/"
          className={`flex items-center gap-4 px-4 py-3 rounded-full transition-colors ${
            pathname === '/'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
          }`}
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xl font-semibold">Home</span>
        </Link>

        <Link
          href="/profile"
          className={`flex items-center gap-4 px-4 py-3 rounded-full transition-colors ${
            pathname === '/profile'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
          }`}
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xl font-semibold">Profile</span>
        </Link>

        <button
          onClick={handlePostClick}
          className="w-full bg-white text-black px-4 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors mt-4"
        >
          Post
        </button>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-800">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center gap-3 p-3 rounded-full hover:bg-gray-900 transition-colors"
          >
            <img
              src={session.user.image || '/default-avatar.png'}
              alt={session.user.name || 'User'}
              className="w-10 h-10 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%23333"%3E%3C/svg%3E';
              }}
            />
            <div className="flex-1 text-left">
              <div className="text-white font-semibold truncate">
                {session.user.name || 'User'}
              </div>
              <div className="text-gray-400 text-sm truncate">
                @{session.user.userID || 'user'}
              </div>
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 rounded-lg shadow-lg border border-gray-800 overflow-hidden">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

