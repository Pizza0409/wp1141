'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogout, setShowLogout] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  if (!session?.user) {
    return null;
  }

  const navItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Profile', path: `/profile/${session.user.userID}`, icon: '👤' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-black border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <div className="text-2xl font-bold text-white">✱</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path === '/' && pathname.startsWith('/post'));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-semibold">{item.name}</span>
            </Link>
          );
        })}

        {/* Post Button */}
        <button
          onClick={() => router.push('/?post=true')}
          className="w-full bg-white text-black px-4 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors mt-4"
        >
          Post
        </button>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-800 relative" ref={dropdownRef}>
        <button
          onClick={() => setShowLogout(!showLogout)}
          className="w-full flex items-center gap-3 p-3 rounded-full hover:bg-gray-900 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
            {session.user.image ? (
              <img src={session.user.image} alt={session.user.name || ''} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-lg">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="text-white font-semibold text-sm truncate">
              {session.user.name || 'User'}
            </div>
            <div className="text-gray-400 text-xs truncate">@{session.user.userID}</div>
          </div>
        </button>

        {/* Logout Dropdown */}
        {showLogout && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-800 transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

