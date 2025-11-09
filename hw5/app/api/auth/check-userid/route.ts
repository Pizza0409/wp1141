import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const { userID: rawUserID } = await request.json();

    if (!rawUserID || typeof rawUserID !== 'string') {
      return NextResponse.json({ error: 'userID is required' }, { status: 400 });
    }

    const userID = rawUserID.trim();

    // Validate userID format
    if (!/^[a-zA-Z0-9_]+$/.test(userID)) {
      return NextResponse.json(
        { error: 'Invalid userID format' },
        { status: 400 }
      );
    }

    if (userID.length < 3 || userID.length > 20) {
      return NextResponse.json(
        { error: 'Invalid userID length' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by userID
    const user = await User.findOne({ userID }).select('provider email');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      provider: user.provider,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Check userID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

