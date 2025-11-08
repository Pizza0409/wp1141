import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      userID?: string;
      email?: string;
      name?: string;
      image?: string;
      provider?: string;
      providerAccountId?: string;
    };
  }

  interface User {
    userID?: string;
    provider?: string;
    providerAccountId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userID?: string;
    provider?: string;
    providerAccountId?: string;
  }
}

