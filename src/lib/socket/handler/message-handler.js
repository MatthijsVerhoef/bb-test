export class MessageHandler {
    constructor(prisma, rateLimiter, notificationBatcher, metrics) {
      this.prisma = prisma;
      this.rateLimiter = rateLimiter;
      this.notificationBatcher = notificationBatcher;
      this.metrics = metrics;
    }
  
    async handleSendMessage(socket, data, io) {
      const { roomId, message, attachments } = data;
      
      // Rate limiting
      const rateLimit = this.rateLimiter.check(socket.userId, 'SEND_MESSAGE');
      if (rateLimit.limited) {
        this.metrics.recordMessage(true);
        throw new Error('Rate limit exceeded. Please slow down.');
      }
      
      // Validation
      if (!message || message.length < 1 || message.length > 5000) {
        throw new Error('Invalid message length');
      }
      
      // Verify participant
      await this.verifyParticipant(socket.userId, roomId);
      
      // Create message
      const newMessage = await this.prisma.chatMessage.create({
        data: {
          message,
          senderId: socket.userId,
          chatRoomId: roomId,
          attachments: attachments ? JSON.stringify(attachments) : null,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
        },
      });
      
      // Emit to room
      io.to(roomId).emit('new_message', newMessage);
      
      // Handle notifications
      await this.sendNotifications(socket.userId, roomId, io);
      
      this.metrics.recordMessage();
      return newMessage;
    }
  
    async verifyParticipant(userId, roomId) {
      const participant = await this.prisma.chatRoomParticipant.findUnique({
        where: {
          chatRoomId_userId: { chatRoomId: roomId, userId },
        },
      });
      
      if (!participant) {
        // Check if it's a new conversation
        const room = await this.prisma.chatRoom.findUnique({
          where: { id: roomId },
          include: { messages: { take: 1 } },
        });
        
        if (room?.messages.length > 0) {
          throw new Error('Not a participant in this chat');
        }
      }
    }
  
    async sendNotifications(senderId, roomId, io) {
      const participants = await this.prisma.chatRoomParticipant.findMany({
        where: {
          chatRoomId: roomId,
          userId: { not: senderId },
        },
      });
      
      for (const participant of participants) {
        this.notificationBatcher.queue(
          participant.userId,
          {
            userId: participant.userId,
            type: 'CHAT',
            message: 'New message',
            actionUrl: `/chat/${roomId}`,
          },
          (created) => {
            io.to(`user:${participant.userId}`).emit('notification', created);
            this.metrics.recordNotification();
          }
        );
      }
    }
  }