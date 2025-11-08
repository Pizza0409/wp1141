import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose, { Schema, Model } from 'mongoose';
import User from '@/lib/models/User';
import Like from '@/lib/models/Like';

interface IPost {
  _id: mongoose.Types.ObjectId;
  content: string;
  authorID: string;
  authorUserID: string;
  isRepost: boolean;
  originalPostID?: string;
  repostedBy?: string;
  parentPostID?: string; // For comments/replies
  commentCount: number;
  repostCount: number;
  likeCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      required: true,
      maxlength: 280,
    },
    authorID: {
      type: String,
      required: true,
    },
    authorUserID: {
      type: String,
      required: true,
    },
    isRepost: {
      type: Boolean,
      default: false,
    },
    originalPostID: {
      type: String,
    },
    repostedBy: {
      type: String,
    },
    parentPostID: {
      type: String,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    repostCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

let Post: Model<IPost>;

try {
  Post = mongoose.model<IPost>('Post');
} catch {
  Post = mongoose.model<IPost>('Post', PostSchema);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' or 'following'

    await connectDB();

    let query: any = {
      isDeleted: false,
      parentPostID: null, // Only top-level posts, not comments
    };

    // If filtering by following, only show posts from users the current user follows
    if (filter === 'following' && session?.user?.userID) {
      const currentUser = await User.findOne({ userID: session.user.userID });
      if (currentUser && currentUser.following.length > 0) {
        // Include posts from followed users OR reposts by followed users
        query.$or = [
          { authorUserID: { $in: currentUser.following } },
          { repostedBy: { $in: currentUser.following } },
        ];
      } else {
        // User follows no one, return empty array
        return NextResponse.json({ posts: [] });
      }
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get author info and like status for each post
    const postsWithAuthorInfo = await Promise.all(
      posts.map(async (post) => {
        // Get author user info
        const author = await User.findOne({ userID: post.authorUserID }).lean();
        
        // Get like status if user is authenticated
        let isLiked = false;
        if (session?.user?.userID) {
          const like = await Like.findOne({
            userID: session.user.userID,
            postID: post._id.toString(),
          });
          isLiked = !!like;
        }
        
        return {
          ...post,
          authorName: author?.name || '',
          authorDisplayName: author?.displayName || author?.name || '',
          authorImage: author?.image || '',
          isLiked,
        };
      })
    );

    return NextResponse.json({ posts: postsWithAuthorInfo });
  } catch (error: any) {
    console.error('Get posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, parentPostID } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Post content is required' },
        { status: 400 }
      );
    }

    // Import character count utility
    const { countCharacters } = await import('@/lib/utils/characterCount');
    const charCount = countCharacters(content.trim());
    
    if (!charCount.isValid) {
      return NextResponse.json(
        {
          error: `Post exceeds character limit. Current: ${charCount.totalCount}/280`,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const post = new Post({
      content: content.trim(),
      authorID: session.user.id,
      authorUserID: session.user.userID,
      parentPostID: parentPostID || undefined,
    });

    await post.save();

    // If this is a comment, increment parent post's comment count
    if (parentPostID) {
      await Post.findByIdAndUpdate(parentPostID, {
        $inc: { commentCount: 1 },
      });
    }

    return NextResponse.json(
      {
        message: 'Post created successfully',
        post: {
          _id: post._id,
          content: post.content,
          authorUserID: post.authorUserID,
          parentPostID: post.parentPostID,
          createdAt: post.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

