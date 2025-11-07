'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function RegisterPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [userID, setUserID] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session && !session.needsUserID) {
      router.push('/');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
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

      // Update session
      await update();
      router.push('/');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!session?.needsUserID) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Choose your UserID</h1>
          <p className="text-gray-400">This will be your unique identifier</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userID" className="block text-sm font-medium mb-2">
              UserID
            </label>
            <input
              id="userID"
              type="text"
              value={userID}
              onChange={(e) => {
                setUserID(e.target.value.toLowerCase());
                setError('');
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="youruserid"
              pattern="[a-zA-Z0-9_-]{3,20}"
              required
            />
            <p className="mt-2 text-sm text-gray-400">
              3-20 characters, letters, numbers, underscores, and hyphens only
            </p>
          </div>
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || userID.length < 3}
            className="w-full bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

