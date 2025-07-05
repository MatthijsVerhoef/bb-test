import express from 'express';
import { createServer } from 'http';
import next from 'next';
import { PrismaClient } from '@prisma/client';
import { initializeSocketServer } from './socket-server.js';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
const prisma = new PrismaClient();

let isShuttingDown = false;

nextApp.prepare().then(() => {
  const app = express();
  const server = createServer(app);

  // Increase timeouts for Railway
  server.timeout = 120000;
  server.headersTimeout = 120000;
  server.keepAliveTimeout = 120000;

  // Health check endpoint (must be first)
  app.get('/healthz', (req, res) => {
    if (isShuttingDown) {
      return res.status(503).json({ status: 'shutting_down' });
    }
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[Server] ${req.method} ${req.url}`);
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[Server] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });

    next();
  });

  // Initialize Socket.IO
  console.log('Initializing Socket.IO...');
  const io = initializeSocketServer(server, prisma);
  console.log('Socket.IO initialized');

  // IMPORTANT: Let Next.js handle ALL routes including API routes
  // Don't add body parsing middleware here as it conflicts with Next.js
  app.all('*', (req, res) => {
    // For debugging POST issues
    if (req.method === 'POST' && req.url.startsWith('/api/')) {
      console.log(`[Server] Handling POST to ${req.url}`);
    }
    return handle(req, res);
  });

  // Start the server
  const PORT = process.env.PORT || 3000;
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${PORT}`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received: shutting down gracefully`);
    isShuttingDown = true;

    server.close(() => {
      console.log('HTTP server closed');
      
      prisma.$disconnect()
        .then(() => {
          console.log('Database disconnected');
          process.exit(0);
        })
        .catch((err) => {
          console.error('Error disconnecting database:', err);
          process.exit(1);
        });
    });

    setTimeout(() => {
      console.error('Forced shutdown');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});