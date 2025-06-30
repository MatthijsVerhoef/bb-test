// lib/logger.ts
// Production-safe logging that works on Vercel

const isDevelopment = process.env.NODE_ENV === 'development';
const isPreview = process.env.VERCEL_ENV === 'preview';

// Basic logger for general use
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    } else if (typeof window === 'undefined') {
      // Server-side: This WILL appear in Vercel Function logs
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // Errors always log
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (isDevelopment || isPreview) {
      console.warn(...args);
    }
  },
  // Special method for performance tracking
  perf: (message: string, duration?: number) => {
    const logMessage = duration
      ? `[PERF] ${message}: ${duration}ms`
      : `[PERF] ${message}`;
    
    if (typeof window === 'undefined') {
      // Server-side logging
      console.log(logMessage);
    } else {
      // Client-side: Send to analytics or monitoring service
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('Performance', {
          message,
          duration,
          path: window.location.pathname
        });
      }
    }
  }
};

// Performance Logger class for detailed performance tracking
export class PerformanceLogger {
  private timers: Map<string, number> = new Map();
  private logs: Array<{ label: string; duration: number }> = [];

  start(label: string): void {
    this.timers.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`No start time found for label: ${label}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.logs.push({ label, duration });
    this.timers.delete(label);
    
    logger.perf(label, duration);
    return duration;
  }

  async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      this.end(label);
      throw error;
    }
  }

  getSummary(): void {
    // Only log summary in development or if explicitly enabled
    if (!isDevelopment && !isPreview) return;
    
    logger.log('\n=== Performance Summary ===');
    const sortedLogs = [...this.logs].sort((a, b) => b.duration - a.duration);
    
    const totalDuration = this.logs.reduce((sum, log) => sum + log.duration, 0);
    logger.log(`Total Duration: ${totalDuration.toFixed(2)}ms\n`);
    
    sortedLogs.forEach(({ label, duration }) => {
      const percentage = (duration / totalDuration * 100).toFixed(1);
      logger.log(`${label}: ${duration.toFixed(2)}ms (${percentage}%)`);
    });
    logger.log('=========================\n');
  }

  clear(): void {
    this.timers.clear();
    this.logs = [];
  }
}

// Server-side performance logging helper
export function logServerPerformance(phase: string, startTime: number) {
  const duration = Date.now() - startTime;
  logger.perf(`[SERVER] ${phase}`, duration);
}

// Send logs to external service (optional)
export async function logToExternal(data: any) {
  if (process.env.NEXT_PUBLIC_LOG_ENDPOINT) {
    try {
      await fetch(process.env.NEXT_PUBLIC_LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          environment: process.env.VERCEL_ENV || 'development'
        })
      });
    } catch (error) {
      // Fail silently
    }
  }
}

// Export a function to send performance data to external monitoring
export async function reportPerformance(metrics: {
  page: string;
  serverTime?: number;
  clientTime?: number;
  dbQueries?: number;
  [key: string]: any;
}) {
  // Log locally
  logger.log('[Performance Report]', metrics);
  
  // Send to external service if configured
  await logToExternal({
    type: 'performance',
    ...metrics
  });
  
  // Send to Vercel Analytics if available
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('track', 'performance', metrics);
  }
}