export class SocketMetrics {
    constructor() {
      this.metrics = {
        totalConnections: 0,
        activeConnections: 0,
        messagesProcessed: 0,
        messagesRateLimited: 0,
        notificationsCreated: 0,
        errors: {},
        disconnectReasons: {},
        startTime: Date.now(),
      };
    }
  
    recordConnection(userId) {
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;
    }
  
    recordDisconnection(reason) {
      this.metrics.activeConnections--;
      this.metrics.disconnectReasons[reason] = (this.metrics.disconnectReasons[reason] || 0) + 1;
    }
  
    recordMessage(rateLimited = false) {
      this.metrics.messagesProcessed++;
      if (rateLimited) this.metrics.messagesRateLimited++;
    }
  
    recordNotification() {
      this.metrics.notificationsCreated++;
    }
  
    recordError(type, message) {
      if (!this.metrics.errors[type]) this.metrics.errors[type] = {};
      this.metrics.errors[type][message] = (this.metrics.errors[type][message] || 0) + 1;
    }
  
    getMetrics() {
      return {
        ...this.metrics,
        uptime: Date.now() - this.metrics.startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }