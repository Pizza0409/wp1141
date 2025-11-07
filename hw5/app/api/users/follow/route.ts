import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userID } = await request.json();

    if (!userID) {
      return NextResponse.json({ error: 'UserID is required' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({
      where: { userID },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: targetUser.id,
          },
        },
      });

      return NextResponse.json({ following: false });
    } else {
      // Follow
      await db.follow.create({
        data: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      });

      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('Toggle follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

