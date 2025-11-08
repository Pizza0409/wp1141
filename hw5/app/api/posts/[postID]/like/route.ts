import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Like from '@/lib/models/Like';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postID: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.userID) {
      return NextResponse.json({ isLiked: false });
    }

    const { postID } = await params;
    await connectDB();

    const like = await Like.findOne({
      userID: session.user.userID,
      postID: postID,
    });

    return NextResponse.json({ isLiked: !!like });
  } catch (error: any) {
    console.error('Get like status error:', error);
    return NextResponse.json({ isLiked: false });
  }
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

    // Verify post exists
    const post = await Post.findOne({
      _id: postID,
      isDeleted: false,
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      userID: session.user.userID,
      postID: postID,
    });

    if (existingLike) {
      // Unlike: remove like and decrement count
      await Like.findByIdAndDelete(existingLike._id);
      await Post.findByIdAndUpdate(postID, {
        $inc: { likeCount: -1 },
      });

      return NextResponse.json({ message: 'Post unliked', isLiked: false });
    } else {
      // Like: create like and increment count
      const like = new Like({
        userID: session.user.userID,
        postID: postID,
      });

      await like.save();
      await Post.findByIdAndUpdate(postID, {
        $inc: { likeCount: 1 },
      });

      return NextResponse.json({ message: 'Post liked', isLiked: true });
    }
  } catch (error: any) {
    console.error('Toggle like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

