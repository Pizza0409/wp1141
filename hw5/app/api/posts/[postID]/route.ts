import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose, { Model, Schema } from 'mongoose';
import Like from '@/lib/models/Like';
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
    const session = await auth();
    const { postID } = await params;
    await connectDB();

    // Get the post
    const post = await Post.findOne({
      _id: postID,
      isDeleted: false,
    }).lean();

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get all comments for this post
    const comments = await Post.find({
      parentPostID: postID,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get author info for main post
    const postAuthor = await User.findOne({ userID: post.authorUserID }).lean();

    // Check if current user liked this post
    let isLiked = false;
    if (session?.user?.userID) {
      const like = await Like.findOne({
        userID: session.user.userID,
        postID: postID,
      });
      isLiked = !!like;
    }

    // Get author info and like status for comments
    const commentsWithAuthorInfo = await Promise.all(
      comments.map(async (comment) => {
        const commentAuthor = await User.findOne({
          userID: comment.authorUserID,
        }).lean();
        
        let commentIsLiked = false;
        if (session?.user?.userID) {
          const like = await Like.findOne({
            userID: session.user.userID,
            postID: comment._id.toString(),
          });
          commentIsLiked = !!like;
        }
        
        return {
          ...comment,
          authorName: commentAuthor?.name || '',
          authorDisplayName: commentAuthor?.displayName || commentAuthor?.name || '',
          authorImage: commentAuthor?.image || '',
          isLiked: commentIsLiked,
        };
      })
    );

    return NextResponse.json({
      post: {
        ...post,
        authorName: postAuthor?.name || '',
        authorDisplayName: postAuthor?.displayName || postAuthor?.name || '',
        authorImage: postAuthor?.image || '',
        isLiked,
      },
      comments: commentsWithAuthorInfo,
    });
  } catch (error: any) {
    console.error('Get post detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get the post
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

    // Check if user is the author (not for reposts)
    if (post.isRepost) {
      return NextResponse.json(
        { error: 'Cannot delete reposts' },
        { status: 400 }
      );
    }

    if (post.authorUserID !== session.user.userID) {
      return NextResponse.json(
        { error: 'Cannot delete other users posts' },
        { status: 403 }
      );
    }

    // Soft delete
    post.isDeleted = true;
    await post.save();

    // If this post has a parent, decrement its comment count
    if (post.parentPostID) {
      await Post.findByIdAndUpdate(post.parentPostID, {
        $inc: { commentCount: -1 },
      });
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

