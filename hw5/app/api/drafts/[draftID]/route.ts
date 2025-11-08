import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Draft from '@/lib/models/Draft';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ draftID: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draftID } = await params;
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Draft content is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const draft = await Draft.findOne({
      _id: draftID,
      userID: session.user.userID,
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    draft.content = content.trim();
    await draft.save();

    return NextResponse.json({
      message: 'Draft updated successfully',
      draft: {
        _id: draft._id,
        content: draft.content,
        updatedAt: draft.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Update draft error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ draftID: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.userID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draftID } = await params;

    await connectDB();

    const draft = await Draft.findOneAndDelete({
      _id: draftID,
      userID: session.user.userID,
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Draft deleted successfully' });
  } catch (error: any) {
    console.error('Delete draft error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

