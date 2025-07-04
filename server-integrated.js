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

// Track server health
let isShuttingDown = false;

nextApp.prepare().then(() => {
  const app = express();
  const server = createServer(app);

  // Increase server timeouts
  server.timeout = 120000; // 2 minutes
  server.headersTimeout = 120000; // 2 minutes
  server.keepAliveTimeout = 120000; // 2 minutes

  // Health check endpoint (MUST be first)
  app.get('/healthz', (req, res) => {
    if (isShuttingDown) {
      res.status(503).json({ status: 'shutting_down' });
      return;
    }
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[Server] ${req.method} ${req.url}`);
    
    // Log POST body info (not the actual body to avoid memory issues)
    if (req.method === 'POST') {
      console.log(`[Server] POST Headers:`, {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
      });
    }

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[Server] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });

    next();
  });

  // Security middleware
  app.use(helmet({ 
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  
  // Compression
  app.use(compression());
  
  // Body parsing with increased limit
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      // Store raw body for debugging
      req.rawBody = buf.toString('utf8');
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS for API routes
  app.use('/api', cors({
    origin: process.env.NEXTAUTH_URL || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Your existing health endpoint with database check
  app.get('/health', async (req, res) => {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'DEGRADED';
      console.error('Database health check failed:', error);
    }

    res.json(health);
  });



  // Initialize Socket.IO
  console.log('Initializing Socket.IO...');
  const io = initializeSocketServer(server, prisma);
  console.log('Socket.IO initialized');

  // API routes - let Next.js handle these
  app.all('/api/*', (req, res) => {
    console.log(`[Server] Forwarding API route: ${req.method} ${req.url}`);
    
    // Add timeout handling for API routes
    const timeout = setTimeout(() => {
      console.error(`[Server] API route timeout: ${req.method} ${req.url}`);
      if (!res.headersSent) {
        res.status(504).json({ error: 'Gateway timeout' });
      }
    }, 30000); // 30 second timeout

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    return handle(req, res);
  });

  // Let Next.js handle all other routes
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('[Server] Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: dev ? err.message : undefined 
      });
    }
  });

  // Start the server
  const PORT = process.env.PORT || 3000;
  
  server.listen(PORT, () => {
    console.log(`> Ready on port ${PORT}`);
    console.log(`> Next.js + Socket.IO running together`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
    console.log(`> Health check available at: http://localhost:${PORT}/healthz`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} signal received: starting graceful shutdown`);
    isShuttingDown = true;

    // Stop accepting new connections
    server.close((err) => {
      if (err) {
        console.error('Error during server close:', err);
      } else {
        console.log('HTTP server closed successfully');
      }

      // Close database connection
      prisma.$disconnect()
        .then(() => {
          console.log('Database disconnected successfully');
          process.exit(0);
        })
        .catch((err) => {
          console.error('Error disconnecting database:', err);
          process.exit(1);
        });
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit on unhandled promise rejections in production
    if (dev) {
      gracefulShutdown('UNHANDLED_REJECTION');
    }
  });

}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});