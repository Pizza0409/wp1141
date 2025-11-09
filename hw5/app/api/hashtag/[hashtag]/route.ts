import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose, { Model, Schema } from 'mongoose';
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
  { params }: { params: Promise<{ hashtag: string }> }
) {
  try {
    const session = await auth();
    const { hashtag } = await params;
    
    // Decode the hashtag (URL encoded)
    const decodedHashtag = decodeURIComponent(hashtag);
    
    await connectDB();

    // Search for posts containing the hashtag
    // Escape special regex characters and match hashtag followed by space, end of string, or non-word character
    // Use case-insensitive regex to match the hashtag
    const escapedHashtag = decodedHashtag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hashtagPattern = new RegExp(`#${escapedHashtag}(?![\\p{L}\\p{N}_])`, 'iu');
    
    const posts = await Post.find({
      content: hashtagPattern,
      parentPostID: { $exists: false }, // Only top-level posts, not comments
      isDeleted: false,
    })
      .sort({ createdAt: -1 }) // Newest first
      .limit(50)
      .lean();

    // Get author info and like status for each post
    const postsWithAuthorInfo = await Promise.all(
      posts.map(async (post) => {
        const author = await User.findOne({ userID: post.authorUserID }).lean();
        
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
          _id: post._id.toString(),
          authorName: author?.name || '',
          authorDisplayName: author?.displayName || author?.name || '',
          authorImage: author?.image || '',
          isLiked,
        };
      })
    );

    return NextResponse.json({ posts: postsWithAuthorInfo, hashtag: decodedHashtag });
  } catch (error: any) {
    console.error('Get hashtag posts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

