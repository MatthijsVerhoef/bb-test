import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketMetrics {
  connectTime: number | null;
  disconnectCount: number;
  errorCount: number;
  lastError: string | null;
  messagesSent: number;
  messagesReceived: number;
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: Error | null;
  reconnectAttempts: number;
  latency: number;
  metrics: SocketMetrics;
  listeners: Map<string, Set<Function>>;
}

interface SocketActions {
  connect: (userId: string) => Promise<void>;
  disconnect: () => void;
  emit: (event: string, ...args: any[]) => boolean;
  on: (event: string, callback: Function) => () => void;
  once: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
  updateMetrics: (updates: Partial<SocketMetrics>) => void;
  resetState: () => void;
}

const initialMetrics: SocketMetrics = {
  connectTime: null,
  disconnectCount: 0,
  errorCount: 0,
  lastError: null,
  messagesSent: 0,
  messagesReceived: 0,
};

const initialState: SocketState = {
  socket: null,
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  reconnectAttempts: 0,
  latency: 0,
  metrics: initialMetrics,
  listeners: new Map(),
};

export const useSocketStore = create<SocketState & SocketActions>((set, get) => ({
  ...initialState,

  connect: async (userId: string) => {
    const state = get();
    
    if (state.isConnecting || state.socket?.connected) {
      return;
    }

    set({ isConnecting: true, connectionError: null });

    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      const connectStartTime = Date.now();

      const socket = io(socketUrl, {
        auth: { userId },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.close();
          reject(new Error('Connection timeout'));
        }, 10000);

        socket.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      socket.on('connect', () => {
        set({ isConnected: true, reconnectAttempts: 0 });
      });

      socket.on('disconnect', (reason) => {
        set(state => ({ 
          isConnected: false,
          metrics: {
            ...state.metrics,
            disconnectCount: state.metrics.disconnectCount + 1,
          },
        }));
        console.log('[Socket] Disconnected:', reason);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        set({ reconnectAttempts: attemptNumber });
      });

      socket.on('connect_error', (error) => {
        set(state => ({
          connectionError: error,
          metrics: {
            ...state.metrics,
            errorCount: state.metrics.errorCount + 1,
            lastError: error.message,
          },
        }));
        console.error('[Socket] Connection error:', error.message);
      });

      socket.io.on('ping', () => {
        const start = Date.now();
        socket.io.once('pong', () => {
          set({ latency: Date.now() - start });
        });
      });

      const originalEmit = socket.emit.bind(socket);
      socket.emit = (...args: any[]) => {
        get().updateMetrics({ messagesSent: get().metrics.messagesSent + 1 });
        return originalEmit(...args);
      };

      const trackedEvents = ['new_message', 'unread_update', 'messages_read', 'notification'];
      trackedEvents.forEach(event => {
        socket.on(event, (...args) => {
          get().updateMetrics({ messagesReceived: get().metrics.messagesReceived + 1 });
          
          const listeners = get().listeners.get(event);
          if (listeners) {
            listeners.forEach(callback => {
              try {
                callback(...args);
              } catch (error) {
                console.error(`[Socket] Error in listener for ${event}:`, error);
              }
            });
          }
        });
      });

      set({
        socket,
        isConnected: true,
        isConnecting: false,
        metrics: {
          ...get().metrics,
          connectTime: Date.now() - connectStartTime,
        },
      });
    } catch (error) {
      set({
        isConnecting: false,
        connectionError: error as Error,
        metrics: {
          ...get().metrics,
          errorCount: get().metrics.errorCount + 1,
          lastError: (error as Error).message,
        },
      });
      throw error;
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  emit: (event: string, ...args: any[]) => {
    const { socket, isConnected } = get();
    if (!socket || !isConnected) {
      console.warn('[Socket] Cannot emit, socket not connected');
      return false;
    }
    return socket.emit(event, ...args);
  },

  on: (event: string, callback: Function) => {
    const state = get();
    
    if (!state.listeners.has(event)) {
      state.listeners.set(event, new Set());
    }
    state.listeners.get(event)!.add(callback);

    if (state.socket) {
      state.socket.on(event, callback);
    }

    return () => {
      state.listeners.get(event)?.delete(callback);
      if (state.socket) {
        state.socket.off(event, callback);
      }
    };
  },

  once: (event: string, callback: Function) => {
    const { socket } = get();
    if (!socket) {
      console.warn('[Socket] Cannot attach listener, socket not initialized');
      return;
    }
    socket.once(event, callback);
  },

  off: (event: string, callback: Function) => {
    const { socket, listeners } = get();
    listeners.get(event)?.delete(callback);
    if (socket) {
      socket.off(event, callback);
    }
  },

  updateMetrics: (updates: Partial<SocketMetrics>) => {
    set(state => ({
      metrics: { ...state.metrics, ...updates },
    }));
  },

  resetState: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set(initialState);
  },
}));