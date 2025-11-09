'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userID, setUserID] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for error in URL params or sessionStorage (from redirects)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const storedError = sessionStorage.getItem('loginError');
    
    // Clear any expectedUserID/expectedEmail parameters from URL (from previous login attempts)
    const expectedUserID = searchParams.get('expectedUserID');
    const expectedEmail = searchParams.get('expectedEmail');
    if (expectedUserID || expectedEmail) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('expectedUserID');
      newUrl.searchParams.delete('expectedEmail');
      router.replace(newUrl.pathname + newUrl.search);
    }
    
    if (errorParam) {
      let errorMsg = '此用戶不存在';
      if (errorParam === 'EmailMismatch') {
        errorMsg = '登入失敗：請使用註冊時使用的 OAuth 帳號登入';
      }
      setError(errorMsg);
      sessionStorage.setItem('loginError', errorMsg);
    } else if (storedError) {
      setError(storedError);
      // Keep the error in sessionStorage so it persists
    }
  }, [searchParams, router]);

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

    // Clear any previous error from sessionStorage
    sessionStorage.removeItem('loginError');

    try {
      const trimmedUserID = userID.trim();
      console.log('🔵 [CLIENT] Attempting to sign in with userID:', trimmedUserID);
      
      // First, check if userID exists and get the provider
      const checkResponse = await fetch('/api/auth/check-userid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userID: trimmedUserID }),
      });

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        const errorMsg = checkResponse.status === 404 ? '此用戶不存在' : (errorData.error || '查詢用戶失敗');
        console.error('🔵 [CLIENT] Check userID failed:', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const { provider, email } = await checkResponse.json();
      console.log('🔵 [CLIENT] UserID found, provider:', provider, 'email:', email);

      if (!provider || !['google', 'github', 'facebook'].includes(provider)) {
        console.error('🔵 [CLIENT] Invalid provider:', provider);
        setError('無法確定登入方式，請聯繫客服');
        setLoading(false);
        return;
      }

      // Prepare callbackUrl with userID parameter for verification in callback
      const callbackUrl = new URL('/', window.location.origin);
      callbackUrl.searchParams.set('expectedUserID', trimmedUserID);
      callbackUrl.searchParams.set('expectedEmail', email);

      // Prepare authorization parameters based on provider
      const authorizationParams: Record<string, string> = {};
      
      // Google supports login_hint to pre-fill the email
      if (provider === 'google' && email) {
        authorizationParams.login_hint = email;
      }
      // GitHub doesn't support login_hint, but we'll verify in callback
      // Facebook doesn't support login_hint either

      // Redirect to OAuth login with the provider
      // This will redirect to the OAuth provider's login page
      // After successful OAuth login, NextAuth will handle the session
      console.log('🔵 [CLIENT] Redirecting to OAuth provider:', provider, 'with params:', authorizationParams);
      await signIn(provider, {
        callbackUrl: callbackUrl.toString(),
        redirect: true,
        ...(Object.keys(authorizationParams).length > 0 && {
          authorizationParams,
        }),
      });
    } catch (err) {
      console.error('🔵 [CLIENT] SignIn exception:', err);
      const errorMsg = '發生錯誤，請重試';
      setError(errorMsg);
      sessionStorage.setItem('loginError', errorMsg);
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
          <div className="mb-4 p-4 bg-red-500/20 border-l-4 border-red-500 rounded-lg text-red-400 text-sm flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="flex-1">{error}</span>
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
              onChange={(e) => {
                setUserID(e.target.value);
                // Clear error when user starts typing
                if (error) {
                  setError('');
                  sessionStorage.removeItem('loginError');
                }
              }}
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

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

