import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const { userID } = await request.json();

    if (!userID || typeof userID !== 'string') {
      return NextResponse.json({ error: 'userID is required' }, { status: 400 });
    }

    await connectDB();

    // Find user by userID
    const user = await User.findOne({ userID });
    if (!user) {
      return NextResponse.json({ error: 'Invalid userID' }, { status: 401 });
    }

    // Create a session by signing in with credentials
    // For userID login, we'll use a custom approach
    // Since NextAuth doesn't have built-in userID login, we'll create a session manually
    // This requires storing session info and redirecting

    return NextResponse.json({
      message: 'Login successful',
      user: {
        userID: user.userID,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

