// app/api/chat/[roomId]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    // Await params for Next.js 14/15
    const { roomId } = await params;

    // Check if the user is a participant of this chat room
    const participant = await prisma.chatRoomParticipant.findFirst({
      where: {
        userId: userId,
        chatRoomId: roomId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'You are not a participant of this chat room' },
        { status: 403 }
      );
    }

    // Update the last read timestamp for this user
    await prisma.chatRoomParticipant.update({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: userId,
        },
      },
      data: {
        lastRead: new Date(),
      },
    });

    // Mark all messages as read
    await prisma.chatMessage.updateMany({
      where: {
        chatRoomId: roomId,
        senderId: {
          not: userId,
        },
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}