import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose, { Model, Schema } from 'mongoose';
import { countCharacters } from '@/lib/utils/characterCount';
import User from '@/lib/models/User';

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
    const { postID } = await params;
    await connectDB();

    // Get all comments (posts with parentPostID = postID)
    const comments = await Post.find({
      parentPostID: postID,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get author info for each comment
    const commentsWithAuthorInfo = await Promise.all(
      comments.map(async (comment) => {
        const author = await User.findOne({ userID: comment.authorUserID }).lean();
        return {
          ...comment,
          authorName: author?.name || '',
          authorDisplayName: author?.displayName || author?.name || '',
          authorImage: author?.image || '',
        };
      })
    );

    return NextResponse.json({ comments: commentsWithAuthorInfo });
  } catch (error: any) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Validate character count with special rules
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

    // Verify parent post exists
    const parentPost = await Post.findOne({
      _id: postID,
      isDeleted: false,
    });

    if (!parentPost) {
      return NextResponse.json(
        { error: 'Parent post not found' },
        { status: 404 }
      );
    }

    // Create comment
    const comment = new Post({
      content: content.trim(),
      authorID: session.user.id,
      authorUserID: session.user.userID,
      parentPostID: postID,
    });

    await comment.save();

    // Update parent post comment count
    await Post.findByIdAndUpdate(postID, {
      $inc: { commentCount: 1 },
    });

    return NextResponse.json(
      {
        message: 'Comment created successfully',
        comment: {
          _id: comment._id,
          content: comment.content,
          authorUserID: comment.authorUserID,
          parentPostID: comment.parentPostID,
          createdAt: comment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

