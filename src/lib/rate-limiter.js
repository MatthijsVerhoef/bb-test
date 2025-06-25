export class RateLimiter {
    constructor() {
      this.limits = new Map();
      this.rules = {
        SEND_MESSAGE: { max: 10, windowMs: 10000 }, 
        ROOM_OPERATIONS: { max: 30, windowMs: 60000 },
        TYPING: { max: 5, windowMs: 5000 },
      };
    }
  
    check(userId, action) {
      const rule = this.rules[action];
      if (!rule) return { limited: false };
  
      const key = `${userId}_${action}`;
      const now = Date.now();
      
      if (!this.limits.has(key)) {
        this.limits.set(key, { count: 0, resetTime: now + rule.windowMs });
      }
      
      const limit = this.limits.get(key);
      
      if (now > limit.resetTime) {
        limit.count = 0;
        limit.resetTime = now + rule.windowMs;
      }
      
      limit.count++;
      
      return {
        limited: limit.count > rule.max,
        remaining: Math.max(0, rule.max - limit.count),
        resetTime: limit.resetTime,
      };
    }
  
    cleanup() {
      const now = Date.now();
      for (const [key, limit] of this.limits) {
        if (now > limit.resetTime + 60000) {
          this.limits.delete(key);
        }
      }
    }
  }