import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user?: {
      id: string;
      email: string;
      name: string | null;
      userID: string;
      image: string | null;
      bio: string | null;
    };
    userStats?: {
      posts: number;
      followers: number;
      following: number;
    };
    needsUserID?: boolean;
    tempUser?: {
      email: string;
      name: string | null;
      image: string | null;
      provider: string;
      providerId: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    userID?: string;
    needsUserID?: boolean;
    email?: string;
    name?: string | null;
    image?: string | null;
    provider?: string;
    providerId?: string;
  }
}

