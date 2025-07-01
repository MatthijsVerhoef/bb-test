// app/api/chat/[roomId]/check-trailer/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // Get the current user from the session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Await params to get roomId
    const { roomId } = await params;

    // Get trailerId from URL search params
    const { searchParams } = new URL(request.url);
    const trailerId = searchParams.get("trailerId");

    if (!trailerId) {
      return NextResponse.json(
        { error: "trailerId is required" },
        { status: 400 }
      );
    }

    // Check if the chat room exists
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { error: "Chat room not found" },
        { status: 404 }
      );
    }

    // Check if the current user is a participant in this chat room
    const isParticipant = chatRoom.participants.some(
      (p) => p.userId === userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not a participant in this chat room" },
        { status: 403 }
      );
    }

    // Find the other participant(s) in the chat room
    const otherParticipants = chatRoom.participants.filter(
      (p) => p.userId !== userId
    );

    // Get all messages in this chat room
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: roomId,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: {
            id: true,
          },
        },
      },
    });

    // Check if any message mentions this trailer
    const mentionsTrailer = messages.some(
      (message) =>
        message.message &&
        (message.message.includes(`ID: ${trailerId}`) ||
        message.message.includes(`trailerId: ${trailerId}`) ||
        message.message.includes(`trailer ${trailerId}`) ||
        message.message.includes(`aanhanger ${trailerId}`))
    );

    if (!mentionsTrailer) {
      return NextResponse.json({
        mentionsTrailer: false,
        hasPendingMessages: false,
      });
    }

    // Check if there are unanswered messages from the current user
    let hasPendingMessages = false;

    if (messages.length > 0) {
      // Get latest messages (last 10 or all, whichever is less)
      const recentMessages = messages.slice(Math.max(messages.length - 10, 0));

      // Find the last message from the current user
      const lastUserMessageIndex = recentMessages
        .map(msg => msg.sender.id === userId)
        .lastIndexOf(true);

      if (lastUserMessageIndex !== -1) {
        // Check if there's a response after the last user message
        const hasResponse = recentMessages
          .slice(lastUserMessageIndex + 1)
          .some(msg => msg.sender.id !== userId);

        // If no response after the last user message, there are pending messages
        hasPendingMessages = !hasResponse;
      }
    }

    return NextResponse.json({
      mentionsTrailer: true,
      hasPendingMessages,
    });

  } catch (error) {
    console.error("Error checking trailer conversation:", error);
    return NextResponse.json(
      { error: "Failed to check trailer conversation" },
      { status: 500 }
    );
  }
}