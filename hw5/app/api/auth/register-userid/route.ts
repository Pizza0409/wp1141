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

    const { userID } = await request.json();

    if (!userID || typeof userID !== 'string') {
      return NextResponse.json({ error: 'userID is required' }, { status: 400 });
    }

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

    // Check if userID already exists
    const existingUser = await User.findOne({ userID });
    if (existingUser) {
      return NextResponse.json({ error: 'userID already taken' }, { status: 409 });
    }

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
      // User exists, update userID
      user.userID = userID;
      await user.save();
    } else if (provider && providerAccountId) {
      // Create new user with OAuth info
      user = new User({
        userID,
        email,
        name: session.user.name || '',
        image: session.user.image,
        provider: provider as 'google' | 'github' | 'facebook',
        providerAccountId,
      });
      await user.save();
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

