// src/lib/redis-client.ts
import { Redis } from "@upstash/redis";

// Initialize Redis client with optional fallback
let redis: Redis | null = null;
let redisError: Error | null = null;

// Initialize Redis only if environment variables are available
try {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
  } else {
    console.warn("Redis environment variables not configured. Cache will be disabled.");
  }
} catch (error) {
  redisError = error as Error;
  console.error("Failed to initialize Redis client:", error);
}

// Wrapper for get operations with fallback
export async function getCacheValue(key: string): Promise<any> {
  if (!redis) return null;
  
  try {
    return await redis.get(key);
  } catch (error) {
    console.warn(`Redis get error for key ${key}:`, error);
    return null;
  }
}

// Wrapper for set operations with fallback
export async function setCacheValue(key: string, value: any, options?: { ex: number }): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.set(key, value, options);
  } catch (error) {
    console.warn(`Redis set error for key ${key}:`, error);
  }
}

// Wrapper for del operations with fallback
export async function deleteCacheKeys(...keys: string[]): Promise<void> {
  if (!redis || keys.length === 0) return;
  
  try {
    await redis.del(...keys);
  } catch (error) {
    console.warn(`Redis delete error for keys ${keys.join(', ')}:`, error);
  }
}

// Wrapper for keys operations with fallback
export async function findCacheKeys(pattern: string): Promise<string[]> {
  if (!redis) return [];
  
  try {
    return await redis.keys(pattern);
  } catch (error) {
    console.warn(`Redis keys error for pattern ${pattern}:`, error);
    return [];
  }
}

// Export status for debugging
export const redisStatus = {
  isConnected: !!redis && !redisError,
  error: redisError,
};

// Export the raw Redis client if needed, but prefer using the wrapper functions
export { redis };