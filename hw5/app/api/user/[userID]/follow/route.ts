import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userID: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userID: targetUserID } = await params;
    const currentUserID = session.user.userID;

    if (targetUserID === currentUserID) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find both users
    const currentUser = await User.findOne({ userID: currentUserID });
    const targetUser = await User.findOne({ userID: targetUserID });

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already following
    if (currentUser.following.includes(targetUserID)) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    // Add to following list of current user
    if (!currentUser.following.includes(targetUserID)) {
      currentUser.following.push(targetUserID);
      await currentUser.save();
    }

    // Add to followers list of target user
    if (!targetUser.followers.includes(currentUserID)) {
      targetUser.followers.push(currentUserID);
      await targetUser.save();
    }

    return NextResponse.json({ message: 'Successfully followed user' });
  } catch (error: any) {
    console.error('Follow user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userID: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userID: targetUserID } = await params;
    const currentUserID = session.user.userID;

    await connectDB();

    // Find both users
    const currentUser = await User.findOne({ userID: currentUserID });
    const targetUser = await User.findOne({ userID: targetUserID });

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove from following list of current user
    currentUser.following = currentUser.following.filter(
      (id) => id !== targetUserID
    );
    await currentUser.save();

    // Remove from followers list of target user
    targetUser.followers = targetUser.followers.filter(
      (id) => id !== currentUserID
    );
    await targetUser.save();

    return NextResponse.json({ message: 'Successfully unfollowed user' });
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

