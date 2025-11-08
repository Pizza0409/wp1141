import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose, { Model, Schema } from 'mongoose';

interface IPost {
  _id: mongoose.Types.ObjectId;
  content: string;
  authorID: string;
  authorUserID: string;
  isRepost: boolean;
  originalPostID?: string;
  repostedBy?: string;
  parentPostID?: string;
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postID: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postID } = await params;
    await connectDB();

    // Get original post
    const originalPost = await Post.findOne({
      _id: postID,
      isDeleted: false,
    });

    if (!originalPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already reposted this
    const existingRepost = await Post.findOne({
      originalPostID: postID,
      repostedBy: session.user.userID,
      isRepost: true,
    });

    if (existingRepost) {
      return NextResponse.json(
        { error: 'Already reposted this post' },
        { status: 400 }
      );
    }

    // Create repost
    const repost = new Post({
      content: originalPost.content,
      authorID: originalPost.authorID,
      authorUserID: originalPost.authorUserID,
      isRepost: true,
      originalPostID: postID,
      repostedBy: session.user.userID,
    });

    await repost.save();

    // Update original post repost count
    await Post.findByIdAndUpdate(postID, {
      $inc: { repostCount: 1 },
    });

    return NextResponse.json(
      {
        message: 'Post reposted successfully',
        repost: {
          _id: repost._id,
          originalPostID: repost.originalPostID,
          repostedBy: repost.repostedBy,
          createdAt: repost.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create repost error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

