import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Mail, MessageSquare } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useMutation } from "@tanstack/react-query";
import { enhancedFetch } from "@/lib/enhanced-fetch";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ContactInfoProps {
  person: {
    id?: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
    profilePicture?: string;
  };
  label: string;
  showPhone?: boolean;
  showEmail?: boolean;
  showChat?: boolean;
}

export function ContactInfo({
  person,
  label,
  showPhone = true,
  showEmail = true,
  showChat = false,
}: ContactInfoProps) {
  const { setActiveRoom, setDrawerOpen, chatRooms } = useChat();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Mutation to create or get existing chat room
  const createChatRoomMutation = useMutation({
    mutationFn: async (participantId: string) => {
      return enhancedFetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
        cacheConfig: { ttl: 0 },
      });
    },
    onSuccess: (data) => {
      if (data?.id) {
        // Set the new room as active and open the drawer
        setActiveRoom(data.id);
        setDrawerOpen(true);
      }
    },
  });

  const handleChatClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!person.id) return;

    setIsCreatingChat(true);

    try {
      // First check if we already have a chat room with this person
      const existingRoom = chatRooms.find((room) =>
        room.participants.some((p) => p.id === person.id)
      );

      if (existingRoom) {
        // Use existing room
        setActiveRoom(existingRoom.id);
        setDrawerOpen(true);
      } else {
        // Create new room
        await createChatRoomMutation.mutateAsync(person.id);
      }
    } catch (error) {
      console.error("Error creating/opening chat:", error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <>
      <h4 className="font-semibold text-sm mb-2">{label}</h4>
      <div className="border rounded-lg p-4">
        <div className="flex items-center">
          <Avatar className="size-12 rounded-full bg-gray-100">
            <AvatarImage
              alt={`${person.firstName} ${person.lastName}`}
              src={
                person.profilePicture
                  ? `${window.location.origin}${person.profilePicture}`
                  : undefined
              }
            />
            <AvatarFallback className="font-medium">
              {person.firstName[0]}
              {person.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium ms-3">
            {person.firstName} {person.lastName}
          </span>

          {/* Chat button */}
          {showChat && person.id && (
            <Button
              variant="outline"
              className="size-10 rounded-full ms-auto"
              onClick={handleChatClick}
              disabled={isCreatingChat}
            >
              {isCreatingChat ? (
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />
              ) : (
                <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
              )}
            </Button>
          )}

          {/* Phone button */}
          {showPhone && person.phoneNumber && person.phoneNumber.trim() && (
            <Button
              variant="outline"
              className={`size-10 rounded-full ${
                showChat ? "ms-3" : "ms-auto"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `tel:${person.phoneNumber}`;
              }}
            >
              <Phone className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          )}

          {/* Email button */}
          {showEmail && person.email && person.email.trim() && (
            <Button
              variant="outline"
              className={`size-10 rounded-full ${
                showPhone && person.phoneNumber?.trim()
                  ? "ms-3"
                  : showChat
                  ? "ms-3"
                  : "ms-auto"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `mailto:${person.email}`;
              }}
            >
              <Mail className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
