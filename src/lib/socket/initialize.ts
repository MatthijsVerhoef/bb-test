import { useSocketStore } from '@/stores/socket.store';

export async function initializeSocket(userId: string) {
  const { connect, socket, isConnected } = useSocketStore.getState();
  
  if (socket && isConnected) {
    return socket;
  }
  
  await connect(userId);
  return useSocketStore.getState().socket;
}

export function getSocket() {
  return useSocketStore.getState().socket;
}

export function getSocketMetrics() {
  return useSocketStore.getState().metrics;
}

export function disconnectSocket() {
  useSocketStore.getState().disconnect();
}