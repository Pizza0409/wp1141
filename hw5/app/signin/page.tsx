'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const [userID, setUserID] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'facebook') => {
    setError('');
    try {
      const result = await signIn(provider, {
        callbackUrl: '/register-userid',
        redirect: true,
      });
    } catch (err) {
      setError('Failed to sign in. Please try again.');
    }
  };

  const handleUserIDLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('userID', {
        userID,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid userID');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        router.push('/');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">X</h1>
          <h2 className="text-2xl font-bold text-white mb-4">Sign in to X</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <button
            onClick={() => handleOAuthSignIn('google')}
            className="w-full py-3 px-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors"
          >
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuthSignIn('github')}
            className="w-full py-3 px-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors"
          >
            Continue with GitHub
          </button>

          <button
            onClick={() => handleOAuthSignIn('facebook')}
            className="w-full py-3 px-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors"
          >
            Continue with Facebook
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-black text-gray-400">Or</span>
          </div>
        </div>

        <form onSubmit={handleUserIDLogin} className="space-y-4">
          <div>
            <input
              type="text"
              value={userID}
              onChange={(e) => setUserID(e.target.value)}
              placeholder="Enter your userID"
              className="w-full py-3 px-4 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in with userID'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link href="/signin" className="text-blue-400 hover:underline">
            Sign up with OAuth above
          </Link>
        </p>
      </div>
    </div>
  );
}

