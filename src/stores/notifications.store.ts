"use client";

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiClient } from '@/lib/api-client';
import { useAuthStore } from './auth.store';

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  type: string;
  actionUrl?: string;
  createdAt: string;
}

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  isMarkingAllAsRead: boolean;
  deletingIds: Set<string>;
}

interface NotificationsActions {
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

interface NotificationsStore extends NotificationsState {
  actions: NotificationsActions;
}

export const useNotificationsStore = create<NotificationsStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      items: [],
      unreadCount: 0,
      loading: true,
      error: null,
      isMarkingAllAsRead: false,
      deletingIds: new Set(),

      actions: {
        markAsRead: async (id: string) => {
          const user = useAuthStore.getState().user;
          if (!user) return;
          
          // Optimistically update UI
          set(state => {
            const notification = state.items.find(n => n.id === id);
            if (notification && !notification.read) {
              notification.read = true;
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          });
          
          try {
            await ApiClient.fetch(`/api/notifications/${id}/read`, {
              method: 'PUT',
            });
          } catch (error) {
            console.error("Error marking notification as read:", error);
            // Rollback on error
            set(state => {
              const notification = state.items.find(n => n.id === id);
              if (notification) {
                notification.read = false;
                state.unreadCount += 1;
              }
            });
          }
        },

        markAllAsRead: async () => {
          const user = useAuthStore.getState().user;
          if (!user) return;
          
          set(state => {
            state.isMarkingAllAsRead = true;
          });
          
          const previousState = {
            items: get().items.map(n => ({ ...n })),
            unreadCount: get().unreadCount,
          };
          
          // Optimistically update UI
          set(state => {
            state.items.forEach(n => n.read = true);
            state.unreadCount = 0;
          });
          
          try {
            await ApiClient.fetch('/api/notifications/read-all', {
              method: 'PUT',
            });
          } catch (error) {
            console.error("Error marking all as read:", error);
            // Rollback on error
            set(state => {
              state.items = previousState.items;
              state.unreadCount = previousState.unreadCount;
            });
          } finally {
            set(state => {
              state.isMarkingAllAsRead = false;
            });
          }
        },

        deleteNotification: async (id: string) => {
          set(state => {
            state.deletingIds.add(id);
          });
          
          const previousState = {
            items: [...get().items],
            unreadCount: get().unreadCount,
          };
          
          // Optimistically update UI
          set(state => {
            const index = state.items.findIndex(n => n.id === id);
            if (index !== -1) {
              const notification = state.items[index];
              if (!notification.read) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
              state.items.splice(index, 1);
            }
          });
          
          try {
            await ApiClient.fetch(`/api/notifications/${id}`, {
              method: 'DELETE',
            });
          } catch (error) {
            console.error("Error deleting notification:", error);
            // Rollback on error
            set(state => {
              state.items = previousState.items;
              state.unreadCount = previousState.unreadCount;
            });
          } finally {
            set(state => {
              state.deletingIds.delete(id);
            });
          }
        },

        fetchNotifications: async () => {
          const user = useAuthStore.getState().user;
          
          if (!user) {
            set(state => {
              state.items = [];
              state.unreadCount = 0;
              state.loading = false;
            });
            return;
          }

          try {
            set(state => {
              state.loading = true;
              state.error = null;
            });

            const data = await ApiClient.fetch<{ notifications: Notification[] }>('/api/notifications');
            
            set(state => {
              state.items = data.notifications || [];
              state.unreadCount = state.items.filter(n => !n.read).length;
              state.loading = false;
              state.error = null;
            });
          } catch (error: any) {
            console.error('Error fetching notifications:', error);
            set(state => {
              state.loading = false;
              state.error = error.message || 'Failed to fetch notifications';
            });
          }
        },

        addNotification: (notification: Notification) => {
          set(state => {
            // Check if notification already exists
            const exists = state.items.some(n => n.id === notification.id);
            if (!exists) {
              state.items.unshift(notification);
              if (!notification.read) {
                state.unreadCount += 1;
              }
            }
          });
        },
      },
    })),
    {
      name: 'notifications-store',
    }
  )
);

// Convenience hook
export const useNotifications = () => {
  const { items, unreadCount, loading, error, isMarkingAllAsRead, deletingIds, actions } = useNotificationsStore();
  
  return {
    notifications: items,
    unreadCount,
    loading,
    error,
    wsStatus: "connected" as const, // Since you have socket handling elsewhere
    markAsRead: actions.markAsRead,
    markAllAsRead: actions.markAllAsRead,
    deleteNotification: actions.deleteNotification,
    refreshNotifications: actions.fetchNotifications,
    isMarkingAllAsRead,
    isDeletingNotification: (id: string) => deletingIds.has(id),
  };
};

// Auto-fetch when user logs in
if (typeof window !== 'undefined') {
  useAuthStore.subscribe(
    (state) => state.user,
    (user) => {
      if (user) {
        useNotificationsStore.getState().actions.fetchNotifications();
      } else {
        // Clear notifications when logged out
        useNotificationsStore.setState({
          items: [],
          unreadCount: 0,
          loading: false,
        });
      }
    }
  );
}