import express from 'express';
import { createServer } from 'http';
import next from 'next';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { initializeSocketServer } from './socket-server.js';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
const prisma = new PrismaClient();

nextApp.prepare().then(() => {
  const app = express();
  const server = createServer(app);

  // Your existing middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));

  // IMPORTANT: Add logging for debugging
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  // Your health endpoint
  app.get('/health', async (req, res) => {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'DEGRADED';
    }

    res.json(health);
  });

  // Initialize Socket.IO on the SAME server
  const io = initializeSocketServer(server, prisma);

  // IMPORTANT: Make sure API routes are handled by Next.js
  app.all('/api/*', (req, res) => {
    console.log(`[Server] Forwarding API route: ${req.method} ${req.url}`);
    return handle(req, res);
  });

  // Let Next.js handle all other routes
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Use Railway's provided PORT
  const PORT = process.env.PORT || 3000;
  
  server.listen(PORT, () => {
    console.log(`> Ready on port ${PORT}`);
    console.log(`> Next.js + Socket.IO running together`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      prisma.$disconnect();
      process.exit(0);
    });
  });
});