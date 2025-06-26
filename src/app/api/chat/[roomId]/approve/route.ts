// app/api/chat/[roomId]/approve/route.ts
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
    // Await params to get roomId
    const { roomId } = await params;

    // Check if the user is a participant of this chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: {
        id: roomId,
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 1,
          include: {
            sender: true
          }
        }
      }
    });

    if (!chatRoom) {
      return NextResponse.json(
        { error: 'Chat room not found' },
        { status: 404 }
      );
    }

    // Check if user is a participant
    const isParticipant = chatRoom.participants.some(p => p.user.id === userId);
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant of this chat room' },
        { status: 403 }
      );
    }

    // Get trailer info for the first message if it has trailer attachment
    let trailerId = null;
    let trailerOwnerId = null;
    
    if (chatRoom.messages.length > 0) {
      try {
        const firstMessage = chatRoom.messages[0];
        const attachments = JSON.parse(firstMessage.attachments as string);
        
        // Check if there's a trailer attachment
        const trailerAttachment = attachments.find((a: any) => a.type === 'trailer');
        if (trailerAttachment && trailerAttachment.id) {
          trailerId = trailerAttachment.id;
          
          // Get trailer owner
          const trailer = await prisma.trailer.findUnique({
            where: { id: trailerId },
            select: { ownerId: true }
          });
          
          if (trailer) {
            trailerOwnerId = trailer.ownerId;
          }
        }
      } catch (error) {
        console.error('Error parsing attachments:', error);
        // Continue without trailer info
      }
    }

    // Get first message sender info
    const firstMessageSenderId = chatRoom.messages.length > 0 ? chatRoom.messages[0].sender.id : null;
    
    // Verify the current user did NOT send the first message
    if (firstMessageSenderId === userId) {
      return NextResponse.json(
        { error: 'You cannot approve your own chat request' },
        { status: 403 }
      );
    }

    // Find the other participant to notify
    const otherParticipant = chatRoom.participants.find(
      p => p.user.id !== userId
    );

    // Create a system message to indicate approval
    await prisma.chatMessage.create({
      data: {
        message: 'This chat has been approved by the trailer owner. You can now send messages.',
        senderId: userId,
        chatRoomId: roomId,
        attachments: '[]',
        read: true, // Mark as read by default
      },
    });
    
    // Send a first response from the trailer owner to ensure the chat is considered approved
    await prisma.chatMessage.create({
      data: {
        message: 'Hello! I have approved your chat request. How can I help you with my trailer?',
        senderId: userId,
        chatRoomId: roomId,
        attachments: '[]',
      },
    });

    if (otherParticipant) {
      // Create a notification for the other user
      await prisma.notification.create({
        data: {
          userId: otherParticipant.user.id,
          type: 'CHAT',
          message: `Your chat has been approved. You can now send messages to ${session.user.firstName || 'the trailer owner'}.`,
          actionUrl: `/chat/${roomId}`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving chat:', error);
    return NextResponse.json(
      { error: 'Failed to approve chat' },
      { status: 500 }
    );
  }
}