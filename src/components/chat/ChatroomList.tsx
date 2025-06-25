import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatRoom {
  id: string;
  participants: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  }>;
  lastMessage?: {
    message: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface ChatRoomListProps {
  rooms: ChatRoom[];
  loading: boolean;
  filterType: "all" | "unread";
  onSelectRoom: (roomId: string) => void;
}

const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

export function ChatRoomList({
  rooms,
  loading,
  filterType,
  onSelectRoom,
}: ChatRoomListProps) {
  const filteredRooms = rooms.filter((room) => {
    if (filterType === "all") return true;
    return room.unreadCount > 0;
  });

  if (loading && rooms.length === 0) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center space-x-4 p-3 rounded-lg"
          >
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (filteredRooms.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4"
      >
        <MessageCircle className="h-12 w-12 mb-2" strokeWidth={1.5} />
        <p>
          Geen gesprekken
          {filterType === "unread" ? " om te lezen" : ""}
        </p>
        <p className="text-sm">
          {filterType === "unread"
            ? "Je hebt alle berichten gelezen"
            : "Neem contact op met een verhuurder om te chatten"}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1 p-2" onClick={() => console.log("rooms", rooms)}>
      {filteredRooms.map((room, index) => {
        const otherParticipant = room.participants[0];
        const displayName = otherParticipant?.firstName
          ? `${otherParticipant.firstName} ${otherParticipant.lastName || ""}`
          : "Gebruiker";

        return (
          <motion.div
            key={room.id}
            custom={index}
            variants={listItemVariants}
            initial="hidden"
            animate="visible"
            className="flex items-start space-x-3 p-3 rounded-lg cursor-pointer hover:bg-[#f5f5f5]"
            onClick={() => onSelectRoom(room.id)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.profilePicture || ""} />
              <AvatarFallback>
                <UserRound className="h-4.5 w-4.5" strokeWidth={1.5} />
              </AvatarFallback>
            </Avatar>

            <div className="relative flex-1 min-w-0">
              <div className="flex items-center">
                <h3 className="font-medium text-[13px] truncate">
                  {displayName}
                </h3>
                <AnimatePresence>
                  {room.unreadCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    >
                      <Badge
                        variant="destructive"
                        className="ml-2 rounded-full bg-primary size-5 flex items-center justify-center text-[11px]"
                      >
                        {room.unreadCount}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {room.lastMessage ? (
                <>
                  <p className="text-[13px] text-muted-foreground truncate">
                    {room.lastMessage.message}
                  </p>
                  <p className="text-xs absolute top-0 right-0 text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(room.lastMessage.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-muted-foreground truncate">
                  Stuur een bericht
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
