import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { countCharacters } from '@/lib/linkify';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, content, parentId } = await request.json();

    if (!postId || !content) {
      return NextResponse.json({ error: 'PostId and content are required' }, { status: 400 });
    }

    // Check character count
    const charCount = countCharacters(content);
    if (charCount > 280) {
      return NextResponse.json(
        { error: 'Comment exceeds 280 character limit' },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // If parentId provided, verify it exists
    if (parentId) {
      const parent = await db.comment.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    const comment = await db.comment.create({
      data: {
        postId,
        authorId: session.user.id,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        author: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Broadcast comment added
    await pusherServer.trigger(`post-${postId}`, 'comment-added', {
      comment,
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

