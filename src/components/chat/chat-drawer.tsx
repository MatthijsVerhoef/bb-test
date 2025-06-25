"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Import the extracted components
import { ChatRoomList } from "./ChatroomList";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ChatApprovalStatus } from "./ChatApprovalStatus";
import { AttachmentSidebar } from "./AttachmentSidebar";

// Import hooks - NOW USING THE STORE VERSION
import { useChat } from "@/hooks/useChat"; // The new store-based hook
import { useChatStatus } from "@/hooks/useChatStatus";
import { useAttachments } from "@/hooks/useAttachments";

interface ChatDrawerProps {
  trigger?: React.ReactNode;
}

const drawerVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

const ChatDrawer: React.FC<ChatDrawerProps> = ({
  trigger = (
    <Button variant="outline" size="icon" className="rounded-full">
      <MessageSquare size={20} />
    </Button>
  ),
}) => {
  const [showChatList, setShowChatList] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "unread">("all");
  const [newMessage, setNewMessage] = useState("");

  const { data: session, status } = useSession();

  // NOW USING THE STORE-BASED HOOK
  const {
    chatRooms,
    activeRoomId,
    messages,
    loadingRooms,
    loadingMessages,
    totalUnreadCount,
    isDrawerOpen,
    sendMessage,
    setActiveRoom,
    setDrawerOpen,
    refetchRooms,
  } = useChat();

  const { chatStatus, isLoading: chatStatusLoading } =
    useChatStatus(activeRoomId);
  const {
    attachment,
    attachmentPreview,
    handleAttachment,
    removeAttachment,
    renderAttachment,
  } = useAttachments();

  // Get active chat details
  const activeChat = chatRooms.find((chat) => chat.id === activeRoomId);

  // Initialize data when drawer opens
  useEffect(() => {
    if (isDrawerOpen && status === "authenticated") {
      refetchRooms();
    }
  }, [isDrawerOpen, status, refetchRooms]);

  const handleSelectChat = (roomId: string) => {
    setActiveRoom(roomId); // Using store method
    setShowChatList(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newMessage.trim() === "" && !attachment) return;

    // Check approval status
    if (
      chatStatus?.needsApproval &&
      !chatStatus.isApproved &&
      chatStatus.userSentFirstMessage &&
      messages.length > 0
    ) {
      return;
    }

    try {
      const attachments = attachment
        ? [
            {
              type: attachment.type,
              data: attachment.data,
            },
          ]
        : undefined;

      await sendMessage(newMessage.trim(), attachments);
      setNewMessage("");
      removeAttachment();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const canSendMessage =
    !chatStatus ||
    !chatStatus.needsApproval ||
    chatStatus.isApproved ||
    !chatStatus.userSentFirstMessage ||
    messages.length === 0;

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {trigger}
          {totalUnreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
              {totalUnreadCount}
            </Badge>
          )}
        </div>
      </SheetTrigger>

      <SheetContent
        className={`p-0 flex flex-col rounded-l-md transition-all duration-300 ${
          !showChatList ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-4 pb-4 border-b">
          <SheetTitle
            className="flex items-center text-xl"
            onClick={() => console.log("hey", chatRooms)}
          >
            <AnimatePresence mode="wait">
              {!showChatList && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowChatList(true)}
                    className="mr-2"
                  >
                    <ChevronLeft size={20} />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <span>
              {showChatList
                ? "Berichten"
                : activeChat?.participants[0]?.firstName || "Chat"}
            </span>

            {showChatList && (
              <div className="ms-auto flex items-center gap-2">
                <Button size="icon" variant="ghost">
                  <Search />
                </Button>
                <SheetClose>
                  <X size={20} />
                </SheetClose>
              </div>
            )}
          </SheetTitle>

          {/* Filter buttons */}
          {showChatList && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                Alles
              </Button>
              <Button
                variant={filterType === "unread" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("unread")}
              >
                Ongelezen
              </Button>
            </div>
          )}
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {showChatList ? (
              <motion.div
                key="list"
                variants={drawerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full overflow-y-auto"
              >
                <ChatRoomList
                  rooms={chatRooms}
                  loading={loadingRooms}
                  filterType={filterType}
                  onSelectRoom={handleSelectChat}
                />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                variants={drawerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex h-full"
              >
                {/* Messages area */}
                <div className="flex-1 flex flex-col">
                  <MessageList
                    messages={messages}
                    currentUserId={session?.user?.id}
                    loading={loadingMessages}
                    renderAttachment={renderAttachment}
                  />

                  {/* Approval status */}
                  {activeRoomId &&
                    messages.length > 0 &&
                    chatStatus &&
                    !chatStatus.isApproved && (
                      <ChatApprovalStatus
                        roomId={activeRoomId}
                        onApprove={() => refetchRooms()}
                      />
                    )}

                  {/* Input */}
                  <MessageInput
                    value={newMessage}
                    onChange={setNewMessage}
                    onSubmit={handleSendMessage}
                    disabled={!canSendMessage}
                    placeholder={
                      !canSendMessage
                        ? "Wacht op goedkeuring..."
                        : "Typ je bericht..."
                    }
                    attachment={attachmentPreview}
                    onRemoveAttachment={removeAttachment}
                  />
                </div>

                {/* Attachment sidebar */}
                <AttachmentSidebar
                  onAttachment={handleAttachment}
                  disabled={!canSendMessage}
                  isLessor={session?.user?.role === "LESSOR"}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatDrawer;
