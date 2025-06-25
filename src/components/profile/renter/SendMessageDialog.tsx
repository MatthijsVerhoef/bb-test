"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/useChat";
import { useMutation } from "@tanstack/react-query";
import { enhancedFetch } from "@/lib/enhanced-fetch";
import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

const SendMessageDialog = ({ rental }) => {
  const { chatRooms, setActiveRoom, setDrawerOpen } = useChat();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [existingRoomId, setExistingRoomId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

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
    onSuccess: (data) => {
      if (data?.id) {
        // Set the new room as active and open the drawer
        setActiveRoom(data.id);
        setDrawerOpen(true);

        // Reset state
        setInitialMessage("");
        setDialogOpen(false);
      }
    },
    onError: (error) => {
      console.error("Error creating chat:", error);
    },
  });

  useEffect(() => {
    if (!rental?.lessorId || !chatRooms?.length) {
      return;
    }

    const existingRoom = chatRooms.find((room) =>
      room.participants.some(
        (participant) => participant.id === rental.lessorId
      )
    );

    if (existingRoom) {
      setExistingRoomId(existingRoom.id);
    }
  }, [rental, chatRooms]);

  const createChat = async () => {
    if (!rental.lessorId || !initialMessage.trim()) {
      return;
    }

    setIsCreatingChat(true);

    try {
      await createChatRoomMutation.mutateAsync({
        participantId: rental.lessorId,
        message: initialMessage,
        trailerId: rental.trailerId,
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleMessageClick = () => {
    if (existingRoomId) {
      setActiveRoom(existingRoomId);
      setDrawerOpen(true);
    } else {
      setDialogOpen(true);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger
        className="text-xs flex items-center font-medium border rounded-md h-full ps-2.5 pe-3 cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          handleMessageClick();
        }}
        asChild
      >
        <div>
          <MessageCircle
            className="size-4 min-w-4 min-h-4 mr-2"
            strokeWidth={1.5}
          />
          Contact
        </div>
      </DialogTrigger>

      {!existingRoomId && (
        <DialogContent className="p-8 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Contacteer verhuurder</DialogTitle>
            <DialogDescription>
              Neem contact op met de verhuurder van jouw aanhanger
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col">
            <div className="space-y-3">
              <Label htmlFor="first-message">Bericht*</Label>
              <Textarea
                id="first-message"
                placeholder="Typ hier jouw bericht..."
                className="h-[140px] shadow-none rounded-lg resize-none p-4"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Let op: wanneer je een gesprek start heeft de verhuurder eerst
                de kans om deze te accepteren voordat verder correspondentie
                mogelijk is.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuleren
            </Button>
            <Button
              onClick={createChat}
              disabled={!initialMessage.trim() || isCreatingChat}
            >
              {isCreatingChat ? "Versturen..." : "Verstuur bericht"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default SendMessageDialog;
