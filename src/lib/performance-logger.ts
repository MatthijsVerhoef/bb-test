// lib/performance-logger.ts

export class PerformanceLogger {
    private timers: Map<string, number> = new Map();
    private logs: Array<{ label: string; duration: number }> = [];
  
    start(label: string): void {
      this.timers.set(label, performance.now());
    }
  
    end(label: string): number {
      const startTime = this.timers.get(label);
      if (!startTime) {
        console.warn(`No start time found for label: ${label}`);
        return 0;
      }
  
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.logs.push({ label, duration });
      this.timers.delete(label);
      
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
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
      console.log('\n=== Performance Summary ===');
      const sortedLogs = [...this.logs].sort((a, b) => b.duration - a.duration);
      
      const totalDuration = this.logs.reduce((sum, log) => sum + log.duration, 0);
      console.log(`Total Duration: ${totalDuration.toFixed(2)}ms\n`);
      
      sortedLogs.forEach(({ label, duration }) => {
        const percentage = (duration / totalDuration * 100).toFixed(1);
        console.log(`${label}: ${duration.toFixed(2)}ms (${percentage}%)`);
      });
      console.log('=========================\n');
    }
  
    clear(): void {
      this.timers.clear();
      this.logs = [];
    }
  }
  
  // Server-side performance monitoring
  export function logServerPerformance(phase: string, startTime: number) {
    const duration = Date.now() - startTime;
    console.log(`[SERVER PERF] ${phase}: ${duration}ms`);
  }