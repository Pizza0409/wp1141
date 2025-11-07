import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { countCharacters } from '@/lib/linkify';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all'; // 'all' or 'following'
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');

    let posts;

    if (filter === 'following') {
      // Get posts from users that the current user follows
      const following = await db.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      });

      const followingIds = following.map((f) => f.followingId);

      posts = await db.post.findMany({
        where: {
          authorId: { in: followingIds },
        },
        include: {
          author: true,
          _count: {
            select: {
              comments: true,
              likes: true,
              reposts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });
    } else {
      // Get all posts
      posts = await db.post.findMany({
        include: {
          author: true,
          _count: {
            select: {
              comments: true,
              likes: true,
              reposts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });
    }

    // Check if user liked/reposted each post
    const postIds = posts.map((p) => p.id);
    const [likes, reposts] = await Promise.all([
      db.like.findMany({
        where: {
          userId: session.user.id,
          postId: { in: postIds },
        },
      }),
      db.repost.findMany({
        where: {
          userId: session.user.id,
          postId: { in: postIds },
        },
      }),
    ]);

    const likesSet = new Set(likes.map((l) => l.postId));
    const repostsSet = new Set(reposts.map((r) => r.postId));

    const postsWithInteractions = posts.slice(0, limit).map((post) => ({
      ...post,
      liked: likesSet.has(post.id),
      reposted: repostsSet.has(post.id),
    }));

    const nextCursor = posts.length > limit ? posts[limit].id : null;

    return NextResponse.json({
      posts: postsWithInteractions,
      nextCursor,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check character count
    const charCount = countCharacters(content);
    if (charCount > 280) {
      return NextResponse.json(
        { error: 'Post exceeds 280 character limit' },
        { status: 400 }
      );
    }

    const post = await db.post.create({
      data: {
        authorId: session.user.id,
        content: content.trim(),
      },
      include: {
        author: true,
        _count: {
          select: {
            comments: true,
            likes: true,
            reposts: true,
          },
        },
      },
    });

    return NextResponse.json({ post: { ...post, liked: false, reposted: false } });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

