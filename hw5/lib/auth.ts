import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import Credentials from 'next-auth/providers/credentials';
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
    Credentials({
      name: 'userID',
      credentials: {
        userID: { label: 'UserID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.userID) {
          return null;
        }

        await connectDB();
        const user = await User.findOne({ userID: credentials.userID as string });

        if (!user) {
          return null;
        }

        return {
          id: user._id.toString(),
          userID: user.userID,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Skip for credentials provider (userID login)
      if (!account) {
        return true;
      }

      if (!user.email) {
        return false;
      }

      await connectDB();

      const provider = account.provider as 'google' | 'github' | 'facebook';
      const providerAccountId = account.providerAccountId;

      // Check if user exists with this provider
      const existingUser = await User.findOne({
        provider,
        providerAccountId,
      });

      if (existingUser) {
        // User exists, update session info
        user.id = existingUser._id.toString();
        user.userID = existingUser.userID;
        return true;
      }

      // New user - will need to register userID
      // Store temporary OAuth data in user object for later use
      user.provider = provider;
      user.providerAccountId = providerAccountId;
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.userID = (user as any).userID;
        token.provider = (user as any).provider || 'userID';
        token.providerAccountId = (user as any).providerAccountId;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }

      // Store account info on first sign-in (only available during OAuth callback)
      if (account) {
        token.provider = account.provider as string;
        token.providerAccountId = account.providerAccountId;
      }

      // Refresh userID from database if missing
      if (!token.userID && token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.userID = dbUser.userID;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.image = dbUser.image;
          // Also update provider info from database
          if (!token.provider || !token.providerAccountId) {
            token.provider = dbUser.provider;
            token.providerAccountId = dbUser.providerAccountId;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.userID = token.userID as string;
        session.user.provider = token.provider as string;
        session.user.providerAccountId = token.providerAccountId as string;
      }
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
});

