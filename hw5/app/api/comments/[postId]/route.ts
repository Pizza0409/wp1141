import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;

    // Get all top-level comments (no parent)
    const comments = await db.comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      include: {
        author: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Recursively get replies
    async function getReplies(parentId: string): Promise<any[]> {
      const replies = await db.comment.findMany({
        where: { parentId },
        include: {
          author: true,
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const repliesWithNested = await Promise.all(
        replies.map(async (reply) => ({
          ...reply,
          replies: await getReplies(reply.id),
        }))
      );

      return repliesWithNested;
    }

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => ({
        ...comment,
        replies: await getReplies(comment.id),
      }))
    );

    return NextResponse.json({ comments: commentsWithReplies });
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

