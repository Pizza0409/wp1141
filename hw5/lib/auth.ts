import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import connectDB from './mongodb';
import User from './models/User';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    // Credentials provider removed - userID login now redirects to OAuth provider
    // This prevents unauthorized access by knowing someone's userID
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('=== SIGNIN CALLBACK ===');
      console.log('Account:', account ? account.provider : 'null (credentials)');
      console.log('User email:', user.email);
      
      // All sign-ins must go through OAuth providers
      if (!account) {
        console.log('❌ No account provided - sign in rejected');
        return false;
      }

      if (!user.email) {
        console.log('❌ No email in user object');
        return false;
      }

      await connectDB();

      const provider = account.provider as 'google' | 'github' | 'facebook';
      const providerAccountId = account.providerAccountId;

      console.log('🔍 Checking for existing user with provider:', provider, 'accountId:', providerAccountId);

      // Check if user exists with this provider
      const existingUser = await User.findOne({
        provider,
        providerAccountId,
      });

      if (existingUser) {
        // User exists, update session info
        console.log('✅ Existing user found in database');
        console.log('  - User ID:', existingUser._id.toString());
        console.log('  - userID:', existingUser.userID);
        console.log('  - Email:', existingUser.email);
        user.id = existingUser._id.toString();
        user.userID = existingUser.userID;
        return true;
      }

      // Check if this email is already registered with a different provider account
      // This prevents someone from using a different OAuth account to login with someone else's userID
      // Only reject if email exists AND provider/accountId don't match
      const userWithEmail = await User.findOne({ email: user.email });
      if (userWithEmail) {
        // Email exists - check if provider and accountId match
        if (userWithEmail.provider !== provider || userWithEmail.providerAccountId !== providerAccountId) {
          // Email exists but with different provider/accountId
          // This means someone is trying to login with a different OAuth account
          console.log('❌ Email already registered with different OAuth account');
          console.log('  - Email:', user.email);
          console.log('  - Existing provider:', userWithEmail.provider);
          console.log('  - Existing providerAccountId:', userWithEmail.providerAccountId);
          console.log('  - Attempted provider:', provider);
          console.log('  - Attempted providerAccountId:', providerAccountId);
          return false;
        }
        // If provider and accountId match, allow login (this shouldn't happen as existingUser check should catch it, but just in case)
        console.log('⚠️ Email found with matching provider/accountId but not caught by existingUser check');
        user.id = userWithEmail._id.toString();
        user.userID = userWithEmail.userID;
        return true;
      }

      // New user - will need to register userID
      console.log('📝 New OAuth user - will need to register userID');
      console.log('  - Email:', user.email);
      console.log('  - Provider:', provider);
      console.log('  - ProviderAccountId:', providerAccountId);
      // Store temporary OAuth data in user object for later use
      user.provider = provider;
      user.providerAccountId = providerAccountId;
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      console.log('=== JWT CALLBACK ===');
      console.log('Trigger:', trigger);
      console.log('User:', user ? JSON.stringify(user, null, 2) : 'null');
      console.log('Account:', account ? JSON.stringify(account, null, 2) : 'null');
      console.log('Current token.userID:', token.userID);
      
      // When user signs in (first time)
      if (user) {
        console.log('✅ User object present in JWT callback');
        token.userID = (user as any).userID;
        token.email = user.email || '';
        token.name = user.name || '';
        token.image = user.image || undefined;
        
        console.log('📝 Setting token fields:');
        console.log('  - token.userID:', token.userID);
        console.log('  - token.email:', token.email);
        console.log('  - token.name:', token.name);
        
        // All sign-ins must go through OAuth providers
        if (!account) {
          console.error('❌ No account provided in JWT callback - this should not happen');
          return token;
        }
        
        // For OAuth providers
        token.provider = account.provider as string;
        token.providerAccountId = account.providerAccountId;
        console.log('✅ OAuth provider detected:', token.provider);
      } else {
        console.log('⚠️ No user object in JWT callback (this is normal for subsequent requests)');
      }

      // Store account info on first sign-in (only available during OAuth callback)
      if (account && !token.provider) {
        token.provider = account.provider as string;
        token.providerAccountId = account.providerAccountId;
      }

      // Refresh userID from database if missing (for OAuth users who registered userID)
      // Also refresh on every request to ensure userID is up to date
      if (token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          // Always update userID from database to ensure it's current
          token.userID = dbUser.userID;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.image = dbUser.image;
          // Also update provider info from database if missing
          if (!token.provider || !token.providerAccountId) {
            token.provider = dbUser.provider;
            token.providerAccountId = dbUser.providerAccountId;
          }
          console.log('JWT callback - Refreshed userID from DB:', token.userID);
        }
      }
      
      // All logins now go through OAuth, so we don't need to check for userID provider

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.userID = token.userID as string | undefined;
        session.user.provider = token.provider as string | undefined;
        session.user.providerAccountId = token.providerAccountId as string | undefined;
        if (token.email) {
          session.user.email = token.email as string;
        }
        if (token.name) {
          session.user.name = token.name as string;
        }
        if (token.image) {
          session.user.image = token.image as string;
        }
      }
      console.log('Session callback - token.userID:', token.userID, 'token.email:', token.email, 'session.user.userID:', session.user?.userID);
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  trustHost: true, // Required for NextAuth v5 in some environments
});

