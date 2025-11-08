import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
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
    const { userID } = await params;
    await connectDB();

    const user = await User.findOne({ userID }).select('-providerAccountId');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get post count (posts and reposts, excluding comments)
    // Comments have parentPostID, so we exclude them from the count
    // Count original posts by user (not reposts by others) and posts reposted by user
    const posts = await Post.find({
      $or: [
        // Original posts by this user (not reposts by others)
        {
          authorUserID: userID,
          $or: [
            { isRepost: false },
            { repostedBy: userID }, // User reposted their own post
          ],
        },
        // Posts reposted by this user
        {
          repostedBy: userID,
          isRepost: true,
        },
      ],
      parentPostID: { $exists: false }, // Exclude comments
      isDeleted: false,
    }).select('_id').lean();
    
    // Count unique posts (in case user reposted their own post)
    const uniquePostIds = new Set(posts.map(p => p._id.toString()));
    const postCount = uniquePostIds.size;

    // Check if current user follows this user
    const session = await auth();
    let isFollowing = false;
    if (session?.user?.userID) {
      const currentUser = await User.findOne({
        userID: session.user.userID,
      });
      isFollowing = currentUser?.following.includes(userID) || false;
    }

    return NextResponse.json({
      userID: user.userID,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      bio: user.bio,
      image: user.image,
      backgroundImage: user.backgroundImage,
      following: user.following.length,
      followers: user.followers.length,
      postCount,
      isFollowing,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userID: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userID } = await params;
    const currentUserID = session.user.userID;

    // Only allow users to update their own profile
    if (userID !== currentUserID) {
      return NextResponse.json(
        { error: 'Cannot update other users profile' },
        { status: 403 }
      );
    }

    const { displayName, bio, backgroundImage } = await request.json();

    await connectDB();

    const user = await User.findOne({ userID });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update fields if provided
    if (displayName !== undefined) {
      user.displayName = displayName?.trim() || undefined;
    }
    if (bio !== undefined) {
      user.bio = bio?.trim() || undefined;
    }
    if (backgroundImage !== undefined) {
      user.backgroundImage = backgroundImage?.trim() || undefined;
    }

    await user.save();

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        userID: user.userID,
        name: user.name,
        displayName: user.displayName,
        bio: user.bio,
        image: user.image,
        backgroundImage: user.backgroundImage,
      },
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

