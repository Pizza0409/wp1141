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
        // Use process.stdout.write to ensure logs appear in terminal
        process.stdout.write('\n\n');
        process.stdout.write('═══════════════════════════════════════════════════════════\n');
        process.stdout.write('🔐 AUTHORIZE CALLED - USERID LOGIN ATTEMPT\n');
        process.stdout.write('═══════════════════════════════════════════════════════════\n');
        console.log('📥 Credentials received:', JSON.stringify(credentials, null, 2));
        
        if (!credentials?.userID) {
          console.error('❌ ERROR: No userID provided in credentials');
          process.stdout.write('═══════════════════════════════════════════════════════════\n\n');
          return null;
        }

        try {
          console.log('🔌 Connecting to database...');
          await connectDB();
          console.log('✅ Database connected successfully');
          
          // Trim and validate userID
          const rawUserID = credentials.userID as string;
          const userID = rawUserID.trim();
          
          // Validate userID format (same as registration)
          if (!userID || userID.length === 0) {
            console.log('❌ Empty userID after trim');
            return null;
          }
          
          if (!/^[a-zA-Z0-9_]+$/.test(userID)) {
            console.log('❌ Invalid userID format:', userID);
            return null;
          }
          
          if (userID.length < 3 || userID.length > 20) {
            console.log('❌ userID length invalid:', userID.length);
            return null;
          }
          
          console.log('🔍 Looking for user with userID:', JSON.stringify(userID));
          console.log('🔍 userID length:', userID.length);
          console.log('🔍 userID char codes:', Array.from(userID).map(c => c.charCodeAt(0)));
          
          // Try multiple query strategies to ensure we find the user
          // First, try exact match (case-sensitive)
          let user = await User.findOne({ userID: userID });
          console.log('📊 Exact match query result:', user ? 'User found' : 'User not found');
          
          // If not found, try with trimmed comparison (in case database has extra spaces)
          if (!user) {
            // Query all users and compare manually to catch any edge cases
            const allUsers = await User.find({}).select('userID email provider name image');
            console.log('📋 Checking all users for match...');
            for (const dbUser of allUsers) {
              const dbUserID = String(dbUser.userID).trim();
              if (dbUserID === userID) {
                console.log('✅ Found match via manual comparison:', dbUserID);
                user = dbUser;
                break;
              }
            }
          }
          
          console.log('📊 Final query result:', user ? 'User found' : 'User not found');

          if (!user) {
            // Debug: Show all users in database
            const allUsers = await User.find({}).select('userID email provider').limit(20);
            console.log('📋 All users in DB:');
            allUsers.forEach(u => {
              const dbUserID = String(u.userID);
              console.log(`  - userID: "${dbUserID}" (length: ${dbUserID.length}, email: ${u.email}, provider: ${u.provider})`);
              console.log(`    Char codes: [${Array.from(dbUserID).map(c => c.charCodeAt(0)).join(', ')}]`);
              console.log(`    Searching for: "${userID}" (length: ${userID.length})`);
              console.log(`    Match: ${dbUserID === userID ? 'YES' : 'NO'}`);
            });
            
            // Try to find with regex (case-insensitive) for debugging
            const caseInsensitiveMatch = await User.findOne({ 
              userID: { $regex: new RegExp(`^${userID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
            });
            if (caseInsensitiveMatch) {
              console.log('⚠️ Found case-insensitive match:', caseInsensitiveMatch.userID);
              console.log('⚠️ This suggests a case-sensitivity issue');
              console.log('⚠️ Searching for:', userID, 'Found:', caseInsensitiveMatch.userID);
            }
            
            console.error('\n❌❌❌ USER NOT FOUND ❌❌❌');
            console.error('   Searching for userID:', JSON.stringify(userID));
            process.stdout.write('═══════════════════════════════════════════════════════════\n');
            console.error('❌ LOGIN FAILED - USER DOES NOT EXIST\n\n');
            return null;
          }

          console.log('\n✅✅✅ USER FOUND! ✅✅✅');
          console.log('  📋 User ID:', user._id.toString());
          console.log('  👤 userID:', user.userID);
          console.log('  📧 Email:', user.email);
          console.log('  🏷️  Name:', user.name);
          
          // Return user object with all required fields
          const userObj = {
            id: user._id.toString(),
            userID: user.userID,
            email: user.email || '', // Ensure email is always present
            name: user.name || '',
            image: user.image || undefined,
          };
          
          console.log('\n📤 Returning user object:', JSON.stringify(userObj, null, 2));
          process.stdout.write('═══════════════════════════════════════════════════════════\n');
          console.log('✅✅✅ AUTHORIZE SUCCESS - LOGIN APPROVED ✅✅✅\n');
          return userObj;
        } catch (error: any) {
          process.stdout.write('\n');
          process.stdout.write('═══════════════════════════════════════════════════════════\n');
          console.error('❌❌❌ AUTHORIZE ERROR ❌❌❌');
          console.error('Error name:', error?.name);
          console.error('Error message:', error?.message);
          console.error('Error stack:', error?.stack);
          process.stdout.write('═══════════════════════════════════════════════════════════\n\n');
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('=== SIGNIN CALLBACK ===');
      console.log('Account:', account ? account.provider : 'null (credentials)');
      console.log('User email:', user.email);
      
      // Skip for credentials provider (userID login)
      if (!account) {
        console.log('✅ Credentials provider - allowing sign in');
        return true;
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
        
        // For credentials provider (userID login), account is null
        // Set provider to 'userID' if not already set
        if (!account) {
          token.provider = 'userID';
          token.providerAccountId = user.id; // Use user ID as providerAccountId for userID login
          console.log('✅ Credentials provider detected - Set provider to userID');
          console.log('  - token.provider:', token.provider);
          console.log('  - token.providerAccountId:', token.providerAccountId);
        } else {
          // For OAuth providers
          token.provider = account.provider as string;
          token.providerAccountId = account.providerAccountId;
          console.log('✅ OAuth provider detected:', token.provider);
        }
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
      
      // For userID login, also verify userID exists in database
      if (token.provider === 'userID' && token.userID) {
        await connectDB();
        const dbUser = await User.findOne({ userID: token.userID });
        if (!dbUser) {
          console.error('JWT callback - userID login but user not found in DB:', token.userID);
          // Don't clear token, but log the issue
        } else {
          console.log('JWT callback - Verified userID login user exists:', token.userID);
        }
      }

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

