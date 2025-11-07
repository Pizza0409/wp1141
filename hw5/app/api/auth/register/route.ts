import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateUserID } from '@/lib/utils';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.needsUserID || !session.tempUser) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { userID } = await request.json();

    // Validate userID
    const validation = validateUserID(userID);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if userID is already taken
    const existingUser = await db.user.findUnique({
      where: { userID },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'UserID already taken' }, { status: 409 });
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: session.tempUser.email,
        name: session.tempUser.name,
        userID,
        provider: session.tempUser.provider,
        providerId: session.tempUser.providerId,
        avatar: session.tempUser.image,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

