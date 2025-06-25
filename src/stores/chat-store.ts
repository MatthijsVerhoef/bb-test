import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
  attachments: any;
  sender: {
    id: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  chatRoomId?: string;
  status?: 'sending' | 'sent' | 'failed';
  tempId?: string;
}

interface ChatRoom {
  id: string;
  name?: string;
  participants: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  }>;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  isApproved?: boolean;
  needsApproval?: boolean;
}

interface ChatStore {
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  activeRoomId: string | null;
  isDrawerOpen: boolean;
  
  setRooms: (rooms: ChatRoom[]) => void;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;
  
  setMessages: (roomId: string, messages: ChatMessage[]) => void;
  addMessage: (roomId: string, message: ChatMessage) => void;
  updateMessage: (roomId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  
  setActiveRoom: (roomId: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
  
  markRoomAsRead: (roomId: string) => void;
  
  getTotalUnreadCount: () => number;
}

export const useChatStore = create<ChatStore>()(
  immer((set, get) => ({
    rooms: [],
    messages: {},
    activeRoomId: null,
    isDrawerOpen: false,
    
    setRooms: (rooms) => set(state => {
      state.rooms = rooms;
    }),
    
    updateRoom: (roomId, updates) => set(state => {
      const roomIndex = state.rooms.findIndex(r => r.id === roomId);
      if (roomIndex !== -1) {
        state.rooms[roomIndex] = { ...state.rooms[roomIndex], ...updates };
      }
    }),
    
    setMessages: (roomId, messages) => set(state => {
      const uniqueMessages = Array.from(
        new Map(messages.map(m => [m.id, m])).values()
      ).sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      state.messages[roomId] = uniqueMessages;
    }),
    
    addMessage: (roomId, message) => set(state => {
      const roomMessages = state.messages[roomId] || [];
      
      const exists = roomMessages.some(m => 
        m.id === message.id || 
        (m.tempId && m.tempId === message.tempId)
      );
      
      if (!exists) {
        state.messages[roomId] = [...roomMessages, message];
      }
    }),
    
    updateMessage: (roomId, messageId, updates) => set(state => {
      const roomMessages = state.messages[roomId];
      if (roomMessages) {
        const index = roomMessages.findIndex(m => 
          m.id === messageId || m.tempId === messageId
        );
        if (index !== -1) {
          state.messages[roomId][index] = { ...roomMessages[index], ...updates };
        }
      }
    }),
    
    setActiveRoom: (roomId) => set(state => {
      state.activeRoomId = roomId;
    }),
    
    setDrawerOpen: (open) => set(state => {
      state.isDrawerOpen = open;
    }),
    
    markRoomAsRead: (roomId) => set(state => {
      const roomIndex = state.rooms.findIndex(r => r.id === roomId);
      if (roomIndex !== -1) {
        state.rooms[roomIndex].unreadCount = 0;
      }
    }),
    
    getTotalUnreadCount: () => {
      const rooms = get().rooms;
      return rooms.reduce((total, room) => total + (room.unreadCount || 0), 0);
    },
  }))
);