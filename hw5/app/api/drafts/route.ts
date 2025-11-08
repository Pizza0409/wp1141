import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Draft from '@/lib/models/Draft';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const drafts = await Draft.find({ userID: session.user.userID })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ drafts });
  } catch (error: any) {
    console.error('Get drafts error:', error);
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

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Draft content is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const draft = new Draft({
      userID: session.user.userID,
      content: content.trim(),
    });

    await draft.save();

    return NextResponse.json(
      {
        message: 'Draft saved successfully',
        draft: {
          _id: draft._id,
          content: draft.content,
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create draft error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

