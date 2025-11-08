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
  { params }: { params: Promise<{ userID: string }> }
) {
  try {
    const session = await auth();
    const { userID } = await params;

    // Only allow users to see their own likes
    if (!session || !session.user || !session.user.userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.userID !== userID) {
      return NextResponse.json(
        { error: 'Cannot view other users likes' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get all likes by this user
    const likes = await Like.find({ userID }).sort({ createdAt: -1 }).lean();

    // Get the post IDs
    const postIDs = likes.map((like) => like.postID);

    // Get all posts that were liked
    const posts = await Post.find({
      _id: { $in: postIDs.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('Get user likes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

