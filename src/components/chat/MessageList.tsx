import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  attachments?: any;
}

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  loading: boolean;
  renderAttachment?: (attachment: any) => React.ReactNode;
}

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.3,
    },
  }),
};

export function MessageList({
  messages,
  currentUserId,
  loading,
  renderAttachment,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0 && !loading) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <div className="flex space-x-2 max-w-[80%]">
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              <div>
                <Skeleton
                  className={`h-4 w-24 ${
                    i % 2 === 0 ? "mb-1" : "ml-auto mb-1"
                  }`}
                />
                <Skeleton className="h-16 w-56 rounded-lg" />
              </div>
              {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center text-muted-foreground"
        >
          <MessageSquare className="h-12 w-12 mb-2 mx-auto" />
          <p>Geen berichten</p>
          <p className="text-sm">
            Stuur een bericht om de conversatie te starten
          </p>
        </motion.div>
      </div>
    );
  }

  // Deduplicate messages
  const uniqueMessages = Array.from(
    new Map(messages.map((msg) => [msg.id, msg])).values()
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {uniqueMessages.map((msg, index) => {
        const isCurrentUser = msg.sender.id === currentUserId;

        return (
          <motion.div
            key={msg.id}
            custom={index}
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            className={`flex ${
              isCurrentUser ? "justify-end" : "justify-start"
            }`}
          >
            <div className="flex space-x-2 max-w-[80%]">
              {!isCurrentUser && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.sender.profilePicture || ""} />
                  <AvatarFallback>
                    <UserRound className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div>
                <div className="flex items-center mb-1">
                  {!isCurrentUser && (
                    <p className="text-xs font-medium">
                      {msg.sender.firstName} {msg.sender.lastName}
                    </p>
                  )}
                  <p
                    className={`text-xs text-muted-foreground ${
                      isCurrentUser ? "ml-auto" : "ml-2"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {msg.message && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`px-4 py-2 text-sm rounded-xl ${
                      isCurrentUser
                        ? "bg-[#222222] rounded-tr-sm text-primary-foreground"
                        : "bg-muted rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  </motion.div>
                )}

                {msg.attachments && renderAttachment && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    {renderAttachment(msg.attachments)}
                  </motion.div>
                )}
              </div>

              {isCurrentUser && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUserId} />
                  <AvatarFallback>
                    <UserRound className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </motion.div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
