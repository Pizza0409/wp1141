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

    // Check if already reposted
    const existingRepost = await db.repost.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existingRepost) {
      // Unrepost
      await db.repost.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
      });

      // Get updated count
      const count = await db.repost.count({
        where: { postId },
      });

      // Broadcast update
      await pusherServer.trigger(`post-${postId}`, 'repost-updated', {
        postId,
        count,
        reposted: false,
      });

      return NextResponse.json({ reposted: false, count });
    } else {
      // Repost
      await db.repost.create({
        data: {
          userId: session.user.id,
          postId,
        },
      });

      // Get updated count
      const count = await db.repost.count({
        where: { postId },
      });

      // Broadcast update
      await pusherServer.trigger(`post-${postId}`, 'repost-updated', {
        postId,
        count,
        reposted: true,
      });

      return NextResponse.json({ reposted: true, count });
    }
  } catch (error) {
    console.error('Toggle repost error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

