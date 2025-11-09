'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';

function RegisterUserIDContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userID, setUserID] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    } else if (status === 'authenticated' && session?.user?.userID) {
      // User already has userID, redirect to home
      router.push('/');
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate userID format
    if (!/^[a-zA-Z0-9_]+$/.test(userID)) {
      setError('userID must contain only alphanumeric characters and underscores');
      setLoading(false);
      return;
    }

    if (userID.length < 3 || userID.length > 20) {
      setError('userID must be between 3 and 20 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register-userid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Registration successful, update session and redirect to home
      // Force a session update by reloading
      window.location.href = '/';
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">X</h1>
          <h2 className="text-2xl font-bold text-white mb-4">Choose your userID</h2>
          <p className="text-gray-400 text-sm">
            Your userID is how others will find you. You can use letters, numbers, and underscores.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userID" className="block text-sm font-medium text-gray-400 mb-2">
              userID
            </label>
            <input
              type="text"
              id="userID"
              value={userID}
              onChange={(e) => setUserID(e.target.value)}
              placeholder="Enter your userID"
              className="w-full py-3 px-4 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
              pattern="[a-zA-Z0-9_]+"
              minLength={3}
              maxLength={20}
            />
            <p className="mt-2 text-xs text-gray-500">
              3-20 characters, alphanumeric and underscore only, case-sensitive
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterUserIDPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <RegisterUserIDContent />
    </Suspense>
  );
}

