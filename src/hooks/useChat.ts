import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useChatStore } from '@/stores/chat-store';
import { useSocket } from '@/lib/socket';
import { ApiClient } from '@/lib/api-client';
import { nanoid } from 'nanoid';

export function useChat() {
  const { data: session, status: sessionStatus } = useSession();
  const { socket, isConnected } = useSocket();
  
  const chatRooms = useChatStore(state => state.rooms);
  const messages = useChatStore(state => state.messages);
  const activeRoomId = useChatStore(state => state.activeRoomId);
  const isDrawerOpen = useChatStore(state => state.isDrawerOpen);
  
  const setRooms = useChatStore(state => state.setRooms);
  const setMessages = useChatStore(state => state.setMessages);
  const addMessage = useChatStore(state => state.addMessage);
  const updateMessage = useChatStore(state => state.updateMessage);
  const setActiveRoom = useChatStore(state => state.setActiveRoom);
  const setDrawerOpen = useChatStore(state => state.setDrawerOpen);
  const markRoomAsRead = useChatStore(state => state.markRoomAsRead);
  const updateRoom = useChatStore(state => state.updateRoom);
  const getTotalUnreadCount = useChatStore(state => state.getTotalUnreadCount);
  
  const currentMessages = activeRoomId ? (messages[activeRoomId] || []) : [];
  const totalUnreadCount = getTotalUnreadCount();
  
  const {
    isLoading: loadingRooms,
    refetch: refetchRooms,
  } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      const data = await ApiClient.get<any[]>('/api/chat', {
        cacheConfig: { 
          ttl: 30000,
          cacheKey: 'chat-rooms' 
        }
      });
      
      setRooms(data);
      return data;
    },
    enabled: !!session?.user && sessionStatus === 'authenticated',
    staleTime: 30 * 1000,
  });
  
  useQuery({
    queryKey: ['chat-unread'],
    queryFn: async () => {
      const data = await ApiClient.get<{total: number, rooms: any[]}>('/api/chat/unread', {
        cacheConfig: { 
          ttl: 10000,
          cacheKey: 'chat-unread' 
        }
      });
      
      if (data.rooms) {
        data.rooms.forEach((room: any) => {
          updateRoom(room.chatRoomId, { unreadCount: room.unreadCount });
        });
      }
      
      return data;
    },
    enabled: !!session?.user && sessionStatus === 'authenticated',
    staleTime: 10 * 1000,
    refetchInterval: isDrawerOpen ? 30 * 1000 : false,
  });
  
  const {
    isLoading: loadingMessages,
    refetch: refetchMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ['chat-messages', activeRoomId],
    queryFn: async () => {
      if (!activeRoomId) {
        return [];
      }      
      try {
        const data = await ApiClient.get<any[]>(
          `/api/chat/${activeRoomId}/messages`,
          { 
            cacheConfig: { 
              ttl: 60000,
              cacheKey: `chat-messages-${activeRoomId}` 
            } 
          }
        );
        
        setMessages(activeRoomId, data || []);
        return data || [];
      } catch (error: any) {
        console.error('❌ Error fetching messages:', {
          error,
          errorMessage: error?.message,
          errorStatus: error?.status,
          roomId: activeRoomId,
          userRole: session?.user?.role,
          userId: session?.user?.id,
        });
        throw error;
      }
    },
    enabled: !!session?.user && !!activeRoomId && sessionStatus === 'authenticated',
    staleTime: 60 * 1000,
    onError: (error: any) => {
      console.error('❌ Query error:', {
        error,
        errorMessage: error?.message,
        activeRoomId,
        userRole: session?.user?.role,
      });
    },
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async ({ roomId, message, attachments }: any) => {
      const tempId = nanoid();
      
      const optimisticMessage = {
        id: tempId,
        tempId,
        message,
        createdAt: new Date().toISOString(),
        read: true,
        attachments: attachments || [],
        sender: {
          id: session!.user!.id!,
          firstName: session!.user!.firstName || "",
          lastName: session!.user!.lastName || "",
          profilePicture: session!.user!.image || "",
        },
        chatRoomId: roomId,
        status: 'sending' as const,
      };
      
      addMessage(roomId, optimisticMessage);
      
      const result = await ApiClient.post(`/api/chat/${roomId}/messages`, { 
        message, 
        attachments: attachments ? JSON.stringify(attachments) : undefined 
      }, {
        cacheConfig: { 
          ttl: 0,
          bypassCache: true 
        },
      });
      
      if (socket && isConnected) {
        socket.emit('send_message', {
          roomId,
          message,
          attachments,
          tempId,
        });
      }
      
      return { ...result, tempId };
    },
    onSuccess: (data, variables) => {
      if (data.tempId) {
        updateMessage(variables.roomId, data.tempId, {
          ...data,
          status: 'sent',
          tempId: undefined,
        });
      }
      
      updateRoom(variables.roomId, { lastMessage: data });
    },
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: async (roomId: string) => {
      markRoomAsRead(roomId);
      
      if (socket && isConnected) {
        socket.emit("mark_read", { roomId });
      }
      
      return ApiClient.post(`/api/chat/${roomId}/read`, undefined, {
        cacheConfig: { 
          ttl: 0,
          bypassCache: true 
        },
      });
    },
  });
  
  useEffect(() => {
    if (!socket || !isConnected || !session?.user) return;
    
    const handleNewMessage = (message: any) => {      
      if (!message?.id || !message.chatRoomId) return;
      
      if (message.sender.id === session.user?.id) {
        return;
      }
      
      addMessage(message.chatRoomId, message);
      
      const room = chatRooms.find(r => r.id === message.chatRoomId);
      if (room) {
        updateRoom(message.chatRoomId, {
          lastMessage: message,
          unreadCount: message.chatRoomId === activeRoomId ? 0 : 
            (room.unreadCount || 0) + 1
        });
      }
      
      if (message.chatRoomId === activeRoomId) {
        markAsReadMutation.mutate(activeRoomId);
      }
    };
    
    socket.on("new_message", handleNewMessage);
    
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, isConnected, activeRoomId, session, addMessage, updateRoom, markAsReadMutation, chatRooms]);
  
  useEffect(() => {
    if (activeRoomId && session?.user) {
      markAsReadMutation.mutate(activeRoomId);
    }
  }, [activeRoomId, session]);
  
  const sendMessage = useCallback(async (message: string, attachments?: any) => {
    if (!activeRoomId || !message.trim()) {
      console.error('Cannot send message: no active room or empty message');
      return;
    }
    
    await sendMessageMutation.mutateAsync({
      roomId: activeRoomId,
      message,
      attachments,
    });
  }, [activeRoomId, sendMessageMutation]);
  
  return {
    chatRooms,
    activeRoomId,
    messages: currentMessages,
    loadingRooms,
    loadingMessages,
    totalUnreadCount,
    isDrawerOpen,
    
    sendMessage,
    setActiveRoom,
    setDrawerOpen,
    refetchRooms,
    refetchMessages: () => {
      if (activeRoomId) {
        return refetchMessages();
      }
    },
    
    socketStatus: {
      isConnected,
      isLoading: false,
    },
    
    isAuthenticated: !!session?.user && sessionStatus === 'authenticated',
  };
}