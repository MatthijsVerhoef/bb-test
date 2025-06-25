// src/stores/index.ts
"use client";

// Export all stores and hooks
export { useAuth, useAuthStore, type User } from './auth.store';
export { useFavorites, useFavoritesStore, type TrailerSummary } from './favorites.store';
export { useNotifications, useNotificationsStore, type Notification } from './notifications.store';
export { useChatStore } from './chat-store';
import { useChatStore as useOriginalChatStore } from './chat-store';

export const useChat = () => {
  const state = useOriginalChatStore();
  
  return {
    rooms: state.rooms,
    activeRoomId: state.activeRoomId,
    messages: state.messages,
    loading: { rooms: false, messages: false },
    isVisible: true,
    isChatDrawerOpen: state.isDrawerOpen,
    pendingChat: {
      userId: null,
      message: null,
      trailerId: null,
    },
    totalUnreadCount: state.getTotalUnreadCount(),
    setActiveRoom: state.setActiveRoom,
    openChatDrawer: state.setDrawerOpen,
    startChatWithUser: (userId: string, initialMessage?: string, trailerId?: string) => {
      state.setDrawerOpen(true);
    },
    setRooms: state.setRooms,
    updateRoom: state.updateRoom,
    setMessages: state.setMessages,
    addMessage: state.addMessage,
    updateMessage: state.updateMessage,
    markRoomAsRead: state.markRoomAsRead,
  };
};