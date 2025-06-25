// app/api/chat/[roomId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
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
    
    // Check the messages for trailer information
    if (chatRoom.messages.length > 0) {
      try {
        const firstMessage = chatRoom.messages[0];
        // Safely check and parse attachments
        if (firstMessage.attachments) {
          const attachments = typeof firstMessage.attachments === 'string' 
            ? JSON.parse(firstMessage.attachments) 
            : firstMessage.attachments;
          
          // Check if there's a trailer attachment
          if (Array.isArray(attachments)) {
            const trailerAttachment = attachments.find((a: any) => a.type === 'trailer');
            if (trailerAttachment) {
              // Handle different possible formats of trailer data
              let attachmentId = null;
              
              if (trailerAttachment.data && trailerAttachment.data.id) {
                // Format: { type: 'trailer', data: { id: '123', ... } }
                attachmentId = trailerAttachment.data.id;
              } else if (trailerAttachment.id) {
                // Format: { type: 'trailer', id: '123', ... }
                attachmentId = trailerAttachment.id;
              }
              
              if (attachmentId) {
                trailerId = attachmentId;
                
                // Get trailer owner
                const trailer = await prisma.trailer.findUnique({
                  where: { id: trailerId },
                  select: { ownerId: true }
                });
                
                if (trailer) {
                  trailerOwnerId = trailer.ownerId;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing attachments:', error);
        // Continue without trailer info
      }
    }
    
    console.log('Trailer info lookup:', {
      chatRoomTrailerId: chatRoom.trailerId,
      trailerId,
      trailerOwnerId
    });

    // Determine chat approval status
    // This is about whether the current user owns THIS trailer (not just any trailer)
    const isCurrentUserTrailerOwner = trailerOwnerId === userId;
    
    // Get information about who initiated the conversation
    const initiatedByCurrentUser = chatRoom.messages.length > 0 && 
                                   chatRoom.messages[0].sender.id === userId;
    
    // Count messages in this chat
    const messageCount = await prisma.chatMessage.count({
      where: { chatRoomId: roomId }
    });
    
    console.log('Chat status check:', {
      roomId,
      userId,
      trailerOwnerId,
      trailerId,
      isCurrentUserTrailerOwner,
      initiatedByCurrentUser,
      messageCount,
      firstMessageSender: chatRoom.messages.length > 0 ? chatRoom.messages[0].sender.id : null,
      hasMessages: chatRoom.messages.length > 0
    });
    
    // Only check if trailer owner has sent message if we have a trailer owner
    let trailerOwnerHasSentMessage = false;
    if (trailerOwnerId) {
      const ownerMessage = await prisma.chatMessage.findFirst({
        where: {
          chatRoomId: roomId,
          senderId: trailerOwnerId
        }
      });
      trailerOwnerHasSentMessage = !!ownerMessage;
    }
    
    // Get first message sender info
    const firstMessageSenderId = chatRoom.messages.length > 0 ? chatRoom.messages[0].sender.id : null;
    const userSentFirstMessage = firstMessageSenderId === userId;
    
    // Get other participant (the one who didn't send the first message)
    const otherParticipantId = chatRoom.participants
      .find(p => p.user.id !== firstMessageSenderId)?.user.id || null;
    
    // Simple approval logic:
    // 1. We always need approval if there's more than one message
    const needsApproval = messageCount > 0;
    
    // 2. Chat is approved if both participants have sent messages
    let otherParticipantHasSentMessage = false;
    if (otherParticipantId) {
      const otherMessage = await prisma.chatMessage.findFirst({
        where: {
          chatRoomId: roomId,
          senderId: otherParticipantId
        }
      });
      otherParticipantHasSentMessage = !!otherMessage;
    }
    
    const isApproved = otherParticipantHasSentMessage;

    return NextResponse.json({
      needsApproval,
      isApproved,
      userSentFirstMessage,
      firstMessageSenderId,
      otherParticipantId,
      otherParticipantSentMessage: otherParticipantHasSentMessage
    });
  } catch (error) {
    console.error('Error getting chat status:', error);
    return NextResponse.json(
      { error: 'Failed to get chat status' },
      { status: 500 }
    );
  }
}