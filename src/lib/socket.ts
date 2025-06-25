"use client";

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSocketStore } from '@/stores/socket.store';

export const useSocket = () => {
  const { data: session, status } = useSession();
  const {
    socket,
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempts,
    latency,
    metrics,
    connect,
    disconnect,
    emit,
    on,
    once,
    off,
  } = useSocketStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && !socket && !isConnecting) {
      connect(session.user.id).catch(error => {
        console.error('[Socket] Failed to connect:', error);
      });
    } else if (status === 'unauthenticated' && socket) {
      disconnect();
    }
  }, [status, session?.user?.id, socket, isConnecting, connect, disconnect]);

  useEffect(() => {
    return () => {
      if (status === 'unauthenticated' || !session?.user?.id) {
        disconnect();
      }
    };
  }, [status, session?.user?.id, disconnect]);

  const safeEmit = useCallback((event: string, ...args: any[]) => {
    if (!isConnected) {
      console.warn(`[Socket] Cannot emit '${event}', socket not connected`);
      return false;
    }
    return emit(event, ...args);
  }, [isConnected, emit]);

  const safeOn = useCallback((event: string, callback: Function) => {
    return on(event, callback);
  }, [on]);

  return {
    socket,
    isConnected,
    isLoading: isConnecting,
    connectionError,
    reconnectAttempts,
    latency,
    metrics,
    emit: safeEmit,
    on: safeOn,
    once,
    off,
  };
};

export const useSocketEvent = <T = any>(
  eventName: string,
  handler: (data: T) => void,
  deps: React.DependencyList = []
) => {
  const { on, off } = useSocket();

  useEffect(() => {
    const unsubscribe = on(eventName, handler);
    return () => {
      unsubscribe();
    };
  }, [eventName, ...deps]);
};