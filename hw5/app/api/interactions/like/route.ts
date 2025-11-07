import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'PostId is required' }, { status: 400 });
    }

    // Check if already liked
    const existingLike = await db.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await db.like.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
      });

      // Get updated count
      const count = await db.like.count({
        where: { postId },
      });

      // Broadcast update
      await pusherServer.trigger(`post-${postId}`, 'like-updated', {
        postId,
        count,
        liked: false,
      });

      return NextResponse.json({ liked: false, count });
    } else {
      // Like
      await db.like.create({
        data: {
          userId: session.user.id,
          postId,
        },
      });

      // Get updated count
      const count = await db.like.count({
        where: { postId },
      });

      // Broadcast update
      await pusherServer.trigger(`post-${postId}`, 'like-updated', {
        postId,
        count,
        liked: true,
      });

      return NextResponse.json({ liked: true, count });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

