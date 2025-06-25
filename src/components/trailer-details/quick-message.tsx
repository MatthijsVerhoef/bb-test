// components/trailers/quick-message.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  LogIn,
  MessageSquare,
  Loader2,
  MessageCircle,
  TriangleAlert,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useMutation } from "@tanstack/react-query";
import { enhancedFetch } from "@/lib/enhanced-fetch";
import { useTranslation } from "@/lib/i18n/client";

interface QuickMessageProps {
  isQuickMessageOpen: boolean;
  setIsQuickMessageOpen: (value: boolean) => void;
  trailerId: string;
  ownerId: string;
  trailerTitle?: string;
}

const QuickMessage = ({
  isQuickMessageOpen,
  setIsQuickMessageOpen,
  trailerId,
  ownerId,
  trailerTitle = "deze aanhanger",
}: QuickMessageProps) => {
  const { t } = useTranslation("trailer");
  const { data: session, status } = useSession();
  const router = useRouter();
  const { chatRooms, setActiveRoom, setDrawerOpen } = useChat();

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingExistingConversation, setCheckingExistingConversation] =
    useState(true);
  const [existingConversation, setExistingConversation] = useState<{
    roomId: string;
    hasPendingMessages: boolean;
  } | null>(null);

  // Create chat room mutation
  const createChatRoomMutation = useMutation({
    mutationFn: async ({
      participantId,
      message,
      trailerId,
    }: {
      participantId: string;
      message: string;
      trailerId?: string;
    }) => {
      return enhancedFetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, message, trailerId }),
        cacheConfig: { ttl: 0 },
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      roomId,
      message,
    }: {
      roomId: string;
      message: string;
    }) => {
      return enhancedFetch(`/api/chat/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        cacheConfig: { ttl: 0 },
      });
    },
  });

  // Check authentication status when the component mounts or session changes
  useEffect(() => {
    setIsAuthenticated(status === "authenticated");
  }, [status]);

  // Check for existing conversation with the owner about this trailer
  useEffect(() => {
    if (status !== "authenticated" || !chatRooms || !ownerId) {
      setCheckingExistingConversation(false);
      return;
    }

    // Find a conversation with this owner that mentions this trailer
    const checkExistingConversation = async () => {
      setCheckingExistingConversation(true);

      try {
        // First check if there's a room with this owner
        const ownerRooms = chatRooms.filter((room) =>
          room.participants.some((p) => p.id === ownerId)
        );

        if (ownerRooms.length === 0) {
          setExistingConversation(null);
          setCheckingExistingConversation(false);
          return;
        }

        for (const room of ownerRooms) {
          const response = await fetch(
            `/api/chat/${room.id}/check-trailer?trailerId=${trailerId}`
          );

          if (response.ok) {
            const data = await response.json();

            if (data.mentionsTrailer) {
              setExistingConversation({
                roomId: room.id,
                hasPendingMessages: data.hasPendingMessages,
              });
              setCheckingExistingConversation(false);
              return;
            }
          }
        }

        // No existing conversation found about this trailer
        setExistingConversation(null);
      } catch (error) {
        console.error("Error checking existing conversations:", error);
      } finally {
        setCheckingExistingConversation(false);
      }
    };

    checkExistingConversation();
  }, [status, chatRooms, ownerId, trailerId]);

  const handleSendMessage = async () => {
    setError("");

    // Double-check authentication
    if (status !== "authenticated" || !session?.user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      sessionStorage.setItem("pendingMessage", message);
      sessionStorage.setItem("pendingTrailerId", trailerId);

      setIsQuickMessageOpen(false);
      router.push("/login?redirectReason=message");
      return;
    }

    // Validate message
    if (!message.trim()) {
      setError(t("quickMessage.errors.enterMessage"));
      return;
    }

    setIsSending(true);

    try {
      let chatRoomId;
      const formattedMessage = t("quickMessage.messageFormat", {
        trailerTitle,
        trailerId,
        message,
      });

      // If there's an existing conversation, add to it rather than creating a new one
      if (existingConversation) {
        // Use existing chat room
        chatRoomId = existingConversation.roomId;

        // Send message to existing room
        await sendMessageMutation.mutateAsync({
          roomId: chatRoomId,
          message: formattedMessage,
        });
      } else {
        // Create a new chat room
        const result = await createChatRoomMutation.mutateAsync({
          participantId: ownerId,
          message: formattedMessage,
          trailerId,
        });

        chatRoomId = result.id;
      }

      // Reset and close the dialog
      setMessage("");
      setIsQuickMessageOpen(false);

      // Set the active room and open the chat drawer
      setActiveRoom(chatRoomId);
      setDrawerOpen(true);

      // Also navigate to messages page
      router.push(`/messages?roomId=${chatRoomId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(t("quickMessage.errors.somethingWentWrong"));
    } finally {
      setIsSending(false);
    }
  };

  const handleGoToConversation = () => {
    if (existingConversation) {
      setIsQuickMessageOpen(false);
      // Set the active room and open the chat drawer
      setActiveRoom(existingConversation.roomId);
      setDrawerOpen(true);
      router.push(`/messages?roomId=${existingConversation.roomId}`);
    }
  };

  const handleLoginRedirect = () => {
    sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
    setIsQuickMessageOpen(false);
    router.push("/login?redirectReason=message");
  };

  // Check for saved message after login
  useEffect(() => {
    if (
      isAuthenticated &&
      sessionStorage.getItem("pendingMessage") &&
      sessionStorage.getItem("pendingTrailerId") === trailerId
    ) {
      setMessage(sessionStorage.getItem("pendingMessage") || "");
      sessionStorage.removeItem("pendingMessage");
      sessionStorage.removeItem("pendingTrailerId");
      setIsQuickMessageOpen(true);
    }
  }, [isAuthenticated, trailerId, setIsQuickMessageOpen]);

  return (
    <Dialog open={isQuickMessageOpen} onOpenChange={setIsQuickMessageOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-white hover:bg-gray-100 -mt-3 shadow-none text-black"
          variant="outline"
        >
          {t("quickMessage.askQuestion")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-8 rounded-xl">
        <DialogHeader>
          <DialogTitle>{t("quickMessage.title")}</DialogTitle>
          <DialogDescription>
            {t("quickMessage.description", { trailerTitle })}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          // Unauthenticated user view
          <div className="my-6 text-center">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm">
                {t("quickMessage.auth.loginRequired")}
              </div>

              <Button onClick={handleLoginRedirect} className="mt-2">
                <LogIn className="mr-2 h-4 w-4" />
                {t("quickMessage.auth.loginButton")}
              </Button>
            </div>
          </div>
        ) : checkingExistingConversation ? (
          // Loading state while checking for existing conversations
          <div className="my-6 flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">
              {t("quickMessage.checkingConversations")}
            </span>
          </div>
        ) : existingConversation && existingConversation.hasPendingMessages ? (
          // Existing conversation with pending messages
          <div className="my-0">
            <div className="bg-orange-50 p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <TriangleAlert
                  strokeWidth={1.5}
                  className="h-5 w-5 mr-2 mt-1 flex-shrink-0"
                />
                <div>
                  <p className="font-medium mb-1 text-[13px]">
                    {t("quickMessage.existingConversation.pendingTitle")}
                  </p>
                  <p className="text-xs">
                    {t("quickMessage.existingConversation.pendingDescription")}
                  </p>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleGoToConversation}>
              {t("quickMessage.existingConversation.goToButton")}
            </Button>
          </div>
        ) : (
          // Normal message form (authenticated user, no pending messages)
          <div className="my-4">
            {existingConversation && (
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg mb-4 text-sm">
                {t("quickMessage.existingConversation.continuing")}
              </div>
            )}

            <Textarea
              placeholder={t("quickMessage.form.placeholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
            />

            {error && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button
                variant="secondary"
                onClick={() => setIsQuickMessageOpen(false)}
              >
                {t("quickMessage.form.cancel")}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isSending || !message.trim()}
              >
                {isSending
                  ? t("quickMessage.form.sending")
                  : t("quickMessage.form.send")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickMessage;
