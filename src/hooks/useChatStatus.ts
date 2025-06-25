import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ApiClient } from '@/lib/api-client';

interface ChatStatus {
  needsApproval: boolean;
  isApproved: boolean;
  userSentFirstMessage: boolean;
  firstMessageSenderId: string | null;
  otherParticipantId: string | null;
  otherParticipantSentMessage: boolean;
  isCurrentUserTrailerOwner?: boolean;
}

export function useChatStatus(roomId: string | null) {
  const { data: session } = useSession();
  const [chatStatus, setChatStatus] = useState<ChatStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!roomId || !session?.user) {
      setChatStatus(null);
      return;
    }

    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await ApiClient.get<ChatStatus>(
          `/api/chat/${roomId}/status`,
          {
            cacheConfig: {
              ttl: 60000,
              cacheKey: `chat-status-${roomId}`,
            },
          }
        );
        
        setChatStatus(data);
      } catch (err) {
        console.error('Error fetching chat status:', err);
        setError(err as Error);
        setChatStatus(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [roomId, session]);

  return { chatStatus, isLoading, error };
}