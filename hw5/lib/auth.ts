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

      // Check if user exists with this provider and accountId
      const existingUser = await User.findOne({
        provider,
        providerAccountId,
      });

      if (existingUser) {
        // User exists with matching provider and accountId, update session info
        console.log('✅ Existing user found in database');
        console.log('  - User ID:', existingUser._id.toString());
        console.log('  - userID:', existingUser.userID);
        console.log('  - Email:', existingUser.email);
        console.log('  - Provider:', existingUser.provider);
        user.id = existingUser._id.toString();
        user.userID = existingUser.userID;
        return true;
      }

      // Check if this email is already registered with a different provider
      // If same email but different provider, allow login and use the userID registered with that provider
      const userWithEmail = await User.findOne({ email: user.email });
      if (userWithEmail) {
        // Email exists - check if it's the same provider
        if (userWithEmail.provider === provider) {
          // Same provider but different accountId - this shouldn't happen, but handle it
          console.log('⚠️ Email found with same provider but different accountId');
          console.log('  - Email:', user.email);
          console.log('  - Existing providerAccountId:', userWithEmail.providerAccountId);
          console.log('  - Attempted providerAccountId:', providerAccountId);
          // Reject if accountId doesn't match (security: prevent account takeover)
          return false;
        } else {
          // Same email but different provider - allow login and use the userID for this provider
          // This allows users to register multiple userIDs with the same email using different OAuth providers
          console.log('✅ Email found with different provider - allowing login');
          console.log('  - Email:', user.email);
          console.log('  - Existing provider:', userWithEmail.provider);
          console.log('  - Existing userID:', userWithEmail.userID);
          console.log('  - New provider:', provider);
          console.log('  - New providerAccountId:', providerAccountId);
          
          // Check if there's already a user with this provider and accountId (shouldn't happen, but check)
          const userWithProvider = await User.findOne({
            provider,
            providerAccountId,
          });
          
          if (userWithProvider) {
            // User already exists with this provider/accountId, use that userID
            console.log('  - Found existing user with this provider, using that userID:', userWithProvider.userID);
            user.id = userWithProvider._id.toString();
            user.userID = userWithProvider.userID;
            return true;
          }
          
          // New provider for this email - user will need to register a new userID
          // Store temporary OAuth data for registration
          console.log('  - New provider for this email - user needs to register new userID');
          user.provider = provider;
          user.providerAccountId = providerAccountId;
          return true;
        }
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

