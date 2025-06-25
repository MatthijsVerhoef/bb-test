import { Server } from 'socket.io';
import { RateLimiter } from './src/lib/rate-limiter.js';
import { NotificationBatcher } from './src/lib/socket/handler/notification-batcher.js';
import { SocketMetrics } from './src/lib/socket/handler/socket-metrics.js';
import { MessageHandler } from './src/lib/socket/handler/message-handler.js';
import { RoomHandler } from './src/lib/socket/handler/room-handler.js';

export const initializeSocketServer = (httpServer, prisma) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    perMessageDeflate: {
      threshold: 1024,
    },
    allowEIO3: false, 
  });
  
  const rateLimiter = new RateLimiter();
  const notificationBatcher = new NotificationBatcher(prisma);
  const metrics = new SocketMetrics();
  const messageHandler = new MessageHandler(prisma, rateLimiter, notificationBatcher, metrics);
  const roomHandler = new RoomHandler(prisma, rateLimiter, metrics);
  
  global.socketMetrics = metrics;
  
  const userSocketMap = new Map();
  const socketUserMap = new Map();
  
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const userId = socket.handshake.auth.userId;
      const token = socket.handshake.auth.token;
      
      if (!userId) {
        return next(new Error('Authentication error: No user ID'));
      }
      
      socket.userId = userId;
      socket.joinedAt = new Date();
      
      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, new Set());
      }
      userSocketMap.get(userId).add(socket.id);
      socketUserMap.set(socket.id, userId);
      
      metrics.recordConnection(userId);
      next();
    } catch (error) {
      metrics.recordError('auth_error', error.message);
      next(error);
    }
  });
  
  // Connection handler
  io.on('connection', async (socket) => {
    socket.join(`user:${socket.userId}`);
    
    try {
      await roomHandler.joinUserRooms(socket);
    } catch (error) {
      console.error('[Socket] Error joining rooms:', error);
      socket.emit('error', { message: 'Failed to join chat rooms' });
    }
    
    socket.on('send_message', async (data, callback) => {
      try {
        const result = await messageHandler.handleSendMessage(socket, data, io);
        if (callback) callback({ success: true, data: result });
      } catch (error) {
        console.error('[Socket] Send message error:', error);
        if (callback) callback({ success: false, error: error.message });
        socket.emit('error', { message: error.message });
      }
    });
    
    socket.on('mark_read', async (data, callback) => {
      try {
        await roomHandler.handleMarkRead(socket, data);
        if (callback) callback({ success: true });
      } catch (error) {
        console.error('[Socket] Mark read error:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    });
    
    socket.on('typing', async (data) => {
      try {
        await roomHandler.handleTyping(socket, data, io);
      } catch (error) {
        console.error('[Socket] Typing error:', error);
      }
    });
    
    socket.on('stop_typing', async (data) => {
      try {
        await roomHandler.handleStopTyping(socket, data, io);
      } catch (error) {
        console.error('[Socket] Stop typing error:', error);
      }
    });
    
    socket.on('ping', (callback) => {
      if (callback) callback();
    });
    
    socket.on('get_metrics', (callback) => {
      if (socket.handshake.auth.role === 'ADMIN') {
        callback({
          success: true,
          data: {
            ...metrics.getMetrics(),
            activeConnections: io.sockets.sockets.size,
            activeUsers: userSocketMap.size,
          },
        });
      } else {
        callback({ success: false, error: 'Unauthorized' });
      }
    });
    
    socket.on('disconnect', (reason) => {
      const userId = socketUserMap.get(socket.id);
      if (userId && userSocketMap.has(userId)) {
        const socketIds = userSocketMap.get(userId);
        socketIds.delete(socket.id);
        
        if (socketIds.size === 0) {
          userSocketMap.delete(userId);
          io.to(`user:${userId}`).emit('user_offline', { userId });
        }
      }
      socketUserMap.delete(socket.id);
      
      metrics.recordDisconnection(reason);
    });
    
    socket.on('error', (error) => {
      console.error('[Socket] Socket error:', error);
      metrics.recordError('socket_error', error.message);
    });
  });
  
  setInterval(() => {
    rateLimiter.cleanup();
  }, 60 * 60 * 1000); 
  
  const adminNamespace = io.of('/admin');
  adminNamespace.use(async (socket, next) => {
    const isAdmin = socket.handshake.auth.role === 'ADMIN';
    if (!isAdmin) {
      return next(new Error('Unauthorized'));
    }
    next();
  });
  
  adminNamespace.on('connection', (socket) => {    
    socket.on('broadcast', (data) => {
      io.emit('announcement', data);
    });
    
    socket.on('kick_user', (userId) => {
      const socketIds = userSocketMap.get(userId);
      if (socketIds) {
        socketIds.forEach(socketId => {
          io.sockets.sockets.get(socketId)?.disconnect(true);
        });
      }
    });
  });
  
  return io;
};