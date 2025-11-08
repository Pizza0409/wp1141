import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose, { Model, Schema } from 'mongoose';
import User from '@/lib/models/User';

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
    const { userID } = await params;
    await connectDB();

    // Get all posts and reposts by this user
    const posts = await Post.find({
      $or: [
        { authorUserID: userID },
        { repostedBy: userID },
      ],
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get author info for each post
    const postsWithAuthorInfo = await Promise.all(
      posts.map(async (post) => {
        const author = await User.findOne({ userID: post.authorUserID }).lean();
        return {
          ...post,
          authorName: author?.name || '',
          authorDisplayName: author?.displayName || author?.name || '',
          authorImage: author?.image || '',
        };
      })
    );

    return NextResponse.json({ posts: postsWithAuthorInfo });
  } catch (error: any) {
    console.error('Get user posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

