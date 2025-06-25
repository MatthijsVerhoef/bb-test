"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { enhancedFetch } from "@/lib/enhanced-fetch";
import { motion } from "framer-motion";

interface ChatApprovalStatusProps {
  roomId: string;
  onApprove?: () => void;
}

type ChatStatus = {
  needsApproval: boolean;
  isApproved: boolean;
  userSentFirstMessage: boolean;
  firstMessageSenderId: string | null;
  otherParticipantId: string | null;
  otherParticipantSentMessage: boolean;
};

export function ChatApprovalStatus({
  roomId,
  onApprove,
}: ChatApprovalStatusProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStatus = async () => {
      if (!roomId || !session?.user) return;

      try {
        setLoading(true);
        const data = await enhancedFetch<ChatStatus>(
          `/api/chat/${roomId}/status`,
          {
            cacheConfig: {
              ttl: 60,
              cacheKey: `chat-status-${roomId}`,
            },
          }
        );

        setStatus(data);
        setError("");
      } catch (err) {
        console.error("Error fetching chat status:", err);
        setError("Kon chatstatus niet ophalen");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [roomId, session?.user?.id]);

  // Handle approval action
  const handleApprove = async () => {
    if (!roomId || !status || !session?.user?.id) return;

    const userSentFirstMessage =
      status.userSentFirstMessage ||
      status.firstMessageSenderId === session.user.id;

    if (userSentFirstMessage) {
      setError("Je kunt je eigen chatverzoek niet goedkeuren");
      return;
    }

    try {
      setApproving(true);
      await enhancedFetch(`/api/chat/${roomId}/approve`, {
        method: "POST",
        cacheConfig: { ttl: 0 },
      });

      setStatus((prev) => (prev ? { ...prev, isApproved: true } : null));

      queryClient.invalidateQueries(["chat-messages", roomId]);
      queryClient.invalidateQueries(["chat-rooms"]);

      if (onApprove) {
        onApprove();
      }
    } catch (err) {
      console.error("Error approving chat:", err);
      setError("Kon chat niet goedkeuren. Probeer het opnieuw.");
    } finally {
      setApproving(false);
    }
  };

  const shouldShowUI = useMemo(() => {
    if (loading || !status || !session?.user?.id) {
      return false;
    }

    return status.needsApproval && !status.isApproved;
  }, [loading, status, session?.user?.id]);

  const userSentFirstMessage = useMemo(() => {
    if (!status || !session?.user?.id) return false;

    return (
      status.userSentFirstMessage ||
      status.firstMessageSenderId === session.user.id
    );
  }, [status, session?.user?.id]);

  if (!shouldShowUI) {
    return null;
  }

  if (!userSentFirstMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className=""
      >
        <Alert
          variant="warning"
          className="bg-[#F7F7F7] border-0 p-4 w-[90%] mx-auto"
        >
          <AlertTriangle className="h-5 w-5 text-amber-800" />
          <AlertTitle className="font-medium text-sm mt-[1px]">
            Actie vereist: Chat goedkeuring
          </AlertTitle>
          <AlertDescription className="">
            <p>
              Een potentiële huurder wil chatten over je aanhanger. Keur dit
              gesprek goed om ze berichten te laten sturen.
            </p>
            <div className="mt-2 flex justify-center">
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="bg-primary text-[13px] text-white"
              >
                {approving ? "Goedkeuren..." : "Keur dit gesprek goed"}
              </Button>
              <Button
                variant={"outline"}
                onClick={handleApprove}
                disabled={approving}
                className="text-[13px] ms-3"
              >
                {approving ? "Afkeuren..." : "Afkeuren"}
              </Button>
            </div>
            {error && (
              <p className="text-red-500 mt-2 text-center text-sm">{error}</p>
            )}
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  } else {
    // Renter sees waiting message
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-white"
      >
        <Alert
          variant="default"
          className="bg-gray-100 border-gray-300 shadow-sm"
        >
          <AlertTriangle className="h-5 w-5 text-gray-500" />
          <AlertTitle className="font-medium text-gray-700">
            Wacht op goedkeuring
          </AlertTitle>
          <AlertDescription className="text-gray-600 mt-1 text-sm">
            Wacht tot de verhuurder toestemming geeft om verder te chatten. Je
            kunt pas meer berichten sturen als de verhuurder het gesprek heeft
            goedgekeurd.
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }
}

export default ChatApprovalStatus;
