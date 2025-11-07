import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import { db } from '@/lib/db';
import { validateUserID } from '@/lib/utils';

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
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email || !account) return false;

      const provider = account.provider;
      const providerId = account.providerAccountId;

      // Check if user exists with this provider
      const existingUser = await db.user.findFirst({
        where: {
          provider,
          providerId,
        },
      });

      if (existingUser) {
        return true;
      }

      // New user - check if email already exists
      const emailUser = await db.user.findUnique({
        where: { email: user.email },
      });

      if (emailUser) {
        // Email exists but different provider - create new account
        return true;
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account && user) {
        const provider = account.provider;
        const providerId = account.providerAccountId;

        const dbUser = await db.user.findFirst({
          where: {
            provider,
            providerId,
          },
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.userID = dbUser.userID;
          token.needsUserID = false;
        } else {
          // New user - needs to set userID
          token.needsUserID = true;
          token.email = user.email;
          token.name = user.name;
          token.image = user.image;
          token.provider = provider;
          token.providerId = providerId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        const dbUser = await db.user.findUnique({
          where: { id: token.userId as string },
          include: {
            _count: {
              select: {
                posts: true,
                followers: true,
                following: true,
              },
            },
          },
        });

        if (dbUser) {
          session.user = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            userID: dbUser.userID,
            image: dbUser.avatar,
            bio: dbUser.bio,
          };
          session.userStats = {
            posts: dbUser._count.posts,
            followers: dbUser._count.followers,
            following: dbUser._count.following,
          };
        }
      } else if (token.needsUserID) {
        session.needsUserID = true;
        session.tempUser = {
          email: token.email as string,
          name: token.name as string,
          image: token.image as string,
          provider: token.provider as string,
          providerId: token.providerId as string,
        };
      }

      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
});

export const { GET, POST } = handlers;