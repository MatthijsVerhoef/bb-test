import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  // Parse DATABASE_URL to add connection parameters
  const databaseUrl = process.env.DATABASE_URL;
  
  // Add connection pool parameters for Railway
  const url = new URL(databaseUrl);
  url.searchParams.append('connection_limit', '25');
  url.searchParams.append('pool_timeout', '20');
  url.searchParams.append('connect_timeout', '60');
  
  const client = new PrismaClient({
    datasources: {
      db: {
        url: url.toString(),
      },
    },
    log: process.env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
  });
  
  return client;
};

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;