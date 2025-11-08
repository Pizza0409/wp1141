import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userID: rawUserID } = await request.json();

    if (!rawUserID || typeof rawUserID !== 'string') {
      return NextResponse.json({ error: 'userID is required' }, { status: 400 });
    }

    // Trim userID to ensure consistency with database storage
    const userID = rawUserID.trim();

    // Validate userID format
    if (!/^[a-zA-Z0-9_]+$/.test(userID)) {
      return NextResponse.json(
        { error: 'userID must contain only alphanumeric characters and underscores' },
        { status: 400 }
      );
    }

    if (userID.length < 3 || userID.length > 20) {
      return NextResponse.json(
        { error: 'userID must be between 3 and 20 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get provider info from session token (stored during OAuth)
    const provider = (session.user as any).provider;
    const providerAccountId = (session.user as any).providerAccountId;
    const email = session.user.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in session' },
        { status: 400 }
      );
    }

    // Check if user already exists with this provider
    let user = null;
    if (provider && providerAccountId) {
      user = await User.findOne({
        provider: provider as 'google' | 'github' | 'facebook',
        providerAccountId,
      });
    }

    if (user) {
      // User exists, check if they want to update their userID
      // If the new userID is different from current, check if it's available
      if (user.userID !== userID) {
        const existingUserWithUserID = await User.findOne({ userID });
        if (existingUserWithUserID && existingUserWithUserID._id.toString() !== user._id.toString()) {
          return NextResponse.json({ error: 'userID already taken' }, { status: 409 });
        }
      }
      
      // Update userID
      console.log('📝 Updating existing user with userID:', userID);
      console.log('  - User ID:', user._id.toString());
      console.log('  - Current userID:', user.userID);
      console.log('  - New userID:', userID);
      user.userID = userID;
      await user.save();
      console.log('✅ User updated successfully in database');
    } else if (provider && providerAccountId) {
      // Check if userID already exists before creating new user
      const existingUserWithUserID = await User.findOne({ userID });
      if (existingUserWithUserID) {
        return NextResponse.json({ error: 'userID already taken' }, { status: 409 });
      }
      
      // Create new user with OAuth info
      console.log('📝 Creating new user with userID:', userID);
      console.log('  - Email:', email);
      console.log('  - Provider:', provider);
      console.log('  - ProviderAccountId:', providerAccountId);
      user = new User({
        userID,
        email,
        name: session.user.name || '',
        image: session.user.image,
        provider: provider as 'google' | 'github' | 'facebook',
        providerAccountId,
      });
      await user.save();
      console.log('✅ New user created successfully in database');
      console.log('  - User ID:', user._id.toString());
      console.log('  - userID:', user.userID);
    } else {
      // No provider info - user might have logged in with userID already
      return NextResponse.json(
        { error: 'OAuth provider information missing. Please sign in with OAuth first.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'User registered successfully', userID: user.userID },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'userID already taken' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

