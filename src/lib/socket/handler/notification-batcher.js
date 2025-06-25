export class NotificationBatcher {
    constructor(prisma) {
      this.prisma = prisma;
      this.batches = new Map();
      this.batchWindow = 2000;
      this.maxBatchSize = 5;
    }
  
    queue(userId, notification, callback) {
      if (!this.batches.has(userId)) {
        this.batches.set(userId, { notifications: [], timer: null });
      }
      
      const batch = this.batches.get(userId);
      batch.notifications.push(notification);
      
      if (batch.notifications.length >= this.maxBatchSize) {
        if (batch.timer) clearTimeout(batch.timer);
        this.processBatch(userId, callback);
      } else if (!batch.timer) {
        batch.timer = setTimeout(() => {
          this.processBatch(userId, callback);
        }, this.batchWindow);
      }
    }
  
    async processBatch(userId, callback) {
      const batch = this.batches.get(userId);
      if (!batch || batch.notifications.length === 0) return;
      
      const notifications = [...batch.notifications];
      batch.notifications = [];
      if (batch.timer) clearTimeout(batch.timer);
      batch.timer = null;
      
      try {
        const grouped = this.groupNotifications(notifications);
        const created = await this.createNotifications(userId, grouped);
        if (callback) callback(created);
      } catch (error) {
        console.error('Notification batch error:', error);
      }
    }
  
    groupNotifications(notifications) {
      const groups = { chat: {}, other: [] };
      
      for (const notification of notifications) {
        if (notification.type === 'CHAT') {
          const roomId = notification.actionUrl?.split('/').pop();
          if (!groups.chat[roomId]) groups.chat[roomId] = [];
          groups.chat[roomId].push(notification);
        } else {
          groups.other.push(notification);
        }
      }
      
      return groups;
    }
  
    async createNotifications(userId, grouped) {
      const toCreate = [];
      
      // Consolidate chat notifications
      for (const [roomId, notifications] of Object.entries(grouped.chat)) {
        if (notifications.length === 1) {
          toCreate.push(notifications[0]);
        } else {
          toCreate.push({
            userId,
            type: 'CHAT',
            message: `${notifications.length} new messages`,
            actionUrl: `/chat/${roomId}`,
          });
        }
      }
      
      toCreate.push(...grouped.other);
      
      return await this.prisma.$transaction(
        toCreate.map(data => this.prisma.notification.create({ data }))
      );
    }
  }