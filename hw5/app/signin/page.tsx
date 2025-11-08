'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userID, setUserID] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for error in URL params or sessionStorage (from redirects)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const storedError = sessionStorage.getItem('loginError');
    
    if (errorParam) {
      const errorMsg = '此用戶不存在';
      setError(errorMsg);
      sessionStorage.setItem('loginError', errorMsg);
    } else if (storedError) {
      setError(storedError);
      // Keep the error in sessionStorage so it persists
    }
  }, [searchParams]);

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
      
      // Direct API call to NextAuth credentials endpoint
      // NextAuth v5 uses /api/auth/callback/credentials for credentials provider
      // The provider name in the URL should match the provider name in auth.ts
      const csrfResponse = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfResponse.json();
      console.log('🔵 [CLIENT] CSRF token obtained:', csrfToken);
      
      // Prepare form data for credentials login
      // Provider name is 'userID' as defined in lib/auth.ts
      // Note: NextAuth v5 may need 'json=true' in query string, not form data
      const formData = new URLSearchParams();
      formData.append('userID', trimmedUserID);
      formData.append('csrfToken', csrfToken);
      formData.append('callbackUrl', '/');
      
      // Add json=true to URL query string to get JSON response
      const endpoint = `/api/auth/callback/credentials?json=true`;
      
      console.log('🔵 [CLIENT] Sending POST request to:', endpoint);
      console.log('🔵 [CLIENT] Form data:', formData.toString());
      
      // Send credentials login request
      // Note: NextAuth v5 uses /api/auth/callback/credentials for all credentials providers
      // The provider is identified by the 'userID' field in the form data
      // Add json=true to query string to get JSON response instead of HTML
      const loginResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      console.log('🔵 [CLIENT] Login response status:', loginResponse.status);
      console.log('🔵 [CLIENT] Login response headers:', Object.fromEntries(loginResponse.headers.entries()));
      
      // Check content type - NextAuth may return HTML on error
      const contentType = loginResponse.headers.get('content-type') || '';
      console.log('🔵 [CLIENT] Response content-type:', contentType);
      
      let result: any = null;
      if (contentType.includes('application/json')) {
        // JSON response
        result = await loginResponse.json();
        console.log('🔵 [CLIENT] Login response body (JSON):', result);
      } else {
        // HTML response (likely an error page or redirect)
        const htmlText = await loginResponse.text();
        console.log('🔵 [CLIENT] Login response body (HTML, first 500 chars):', htmlText.substring(0, 500));
        
        // Check if response is a redirect
        const location = loginResponse.headers.get('location');
        if (location) {
          console.log('🔵 [CLIENT] Redirect detected to:', location);
          // Check if redirect contains error
          const url = new URL(location, window.location.origin);
          const error = url.searchParams.get('error');
          if (error) {
            result = { error, ok: false };
            console.log('🔵 [CLIENT] Error in redirect URL:', error);
          } else {
            // Successful redirect
            result = { ok: true, url: location };
            console.log('🔵 [CLIENT] Successful redirect');
          }
        } else {
          // HTML error page - try to extract error message
          result = { error: 'CredentialsSignin', ok: false };
          console.log('🔵 [CLIENT] HTML response without redirect - treating as error');
        }
      }

      // Handle response
      if (loginResponse.ok) {
        // Check if login was successful
        if (result?.ok || result?.url || loginResponse.status === 200) {
          console.log('🔵 [CLIENT] Login successful!');
          // Clear any stored error
          sessionStorage.removeItem('loginError');
          
          // Verify session is set before redirecting
          setTimeout(async () => {
            try {
              const sessionResponse = await fetch('/api/auth/session');
              const session = await sessionResponse.json();
              console.log('🔵 [CLIENT] Session after login:', session);
              
              if (session?.user?.userID) {
                console.log('🔵 [CLIENT] Session verified, redirecting to home');
                window.location.href = '/';
              } else {
                console.error('🔵 [CLIENT] Session not properly set, userID missing');
                setError('登入失敗，session 未正確設置');
                setLoading(false);
              }
            } catch (err) {
              console.error('🔵 [CLIENT] Error verifying session:', err);
              // Still try to redirect, session might be set
              window.location.href = '/';
            }
          }, 500);
        } else {
          // Login failed
          const errorMsg = result?.error === 'CredentialsSignin' ? '此用戶不存在' : (result?.error || '登入失敗');
          console.error('🔵 [CLIENT] Login failed:', errorMsg);
          setError(errorMsg);
          sessionStorage.setItem('loginError', errorMsg);
          setLoading(false);
        }
      } else {
        // HTTP error
        const errorMsg = result?.error === 'CredentialsSignin' ? '此用戶不存在' : (result?.error || '登入失敗');
        console.error('🔵 [CLIENT] Login HTTP error:', loginResponse.status, errorMsg);
        setError(errorMsg);
        sessionStorage.setItem('loginError', errorMsg);
        setLoading(false);
      }
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

