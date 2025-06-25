export class RoomHandler {
    constructor(prisma, rateLimiter, metrics) {
      this.prisma = prisma;
      this.rateLimiter = rateLimiter;
      this.metrics = metrics;
    }
  
    async joinUserRooms(socket) {
      const rooms = await this.prisma.chatRoomParticipant.findMany({
        where: { userId: socket.userId },
        select: { chatRoomId: true },
      });
      
      for (const room of rooms) {
        socket.join(room.chatRoomId);
      }
      
      console.log(`[Socket] User ${socket.userId} joined ${rooms.length} rooms`);
    }
  
    async handleMarkRead(socket, data) {
      const { roomId } = data;
      
      const rateLimit = this.rateLimiter.check(socket.userId, 'ROOM_OPERATIONS');
      if (rateLimit.limited) throw new Error('Rate limit exceeded');
      
      await this.prisma.$transaction([
        this.prisma.chatRoomParticipant.upsert({
          where: {
            chatRoomId_userId: { chatRoomId: roomId, userId: socket.userId },
          },
          create: {
            chatRoomId: roomId,
            userId: socket.userId,
            lastRead: new Date(),
          },
          update: {
            lastRead: new Date(),
          },
        }),
        this.prisma.chatMessage.updateMany({
          where: {
            chatRoomId: roomId,
            senderId: { not: socket.userId },
            read: false,
          },
          data: { read: true },
        }),
      ]);
      
      socket.emit('messages_read', { roomId });
    }
  
    async handleTyping(socket, data, io) {
      const { roomId } = data;
      
      const rateLimit = this.rateLimiter.check(socket.userId, 'TYPING');
      if (rateLimit.limited) return;
      
      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        roomId,
      });
    }
  
    async handleStopTyping(socket, data, io) {
      const { roomId } = data;
      
      socket.to(roomId).emit('user_stop_typing', {
        userId: socket.userId,
        roomId,
      });
    }
  }