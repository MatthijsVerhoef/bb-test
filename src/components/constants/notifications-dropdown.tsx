"use client";

import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  ChevronRight,
  Info,
  MessageCircle,
  X,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/stores/notifications.store";
import { useAuth } from "@/stores/auth.store";
import type { Notification } from "@/stores/notifications.store";

const notificationIcons: Record<string, React.ReactNode> = {
  BOOKING: <CalendarIcon className="size-4 text-black" strokeWidth={1.5} />,
  PAYMENT: <CreditCardIcon className="size-4 text-black" strokeWidth={1.5} />,
  CHAT: <MessageCircle className="size-4 text-black" strokeWidth={1.5} />,
  SYSTEM: <Info className="size-4 text-black" strokeWidth={1.5} />,
  REMINDER: <ClockIcon className="size-4 text-black" strokeWidth={1.5} />,
  PROMOTION: <GiftIcon className="size-4 text-black" strokeWidth={1.5} />,
  OTHER: <Info className="size-4 text-black" strokeWidth={1.5} />,
};

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAllAsRead,
    isDeletingNotification,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  if (!user) {
    return null;
  }

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((notification) => !notification.read)
      : notifications;

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: nl,
    });
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      setOpen(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    e.preventDefault();

    setDeletingIds((prev) => new Set(prev).add(notificationId));

    try {
      await deleteNotification(notificationId);
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full me-3 shadow-none relative hover:bg-gray-100"
        >
          <Bell strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-medium">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        sideOffset={15}
      >
        <div className="p-4 pb-3 flex items-center justify-between">
          <h3 className="font-medium text-base leading-none tracking-tight mt-1 ms-1">
            Notificaties
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs hover:bg-gray-100"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1 h-3.5 w-3.5" />
              )}
              Alles gelezen
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex items-center justify-start p-1 px-1 w-[90%] mx-auto bg-white gap-x-2">
            <TabsTrigger
              value="all"
              className="text-xs max-w-fit px-6 data-[state=active]:bg-[#222222] rounded-full bg-gray-100 py-4 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              Alle
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="text-xs max-w-fit px-6 data-[state=active]:bg-[#222222] rounded-full bg-gray-100 py-4 data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              Ongelezen {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[320px]">
            <TabsContent value="all" className="m-0">
              {renderNotificationList(filteredNotifications)}
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              {renderNotificationList(filteredNotifications)}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );

  function renderNotificationList(notificationsList: Notification[]) {
    if (loading) {
      return (
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (notificationsList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[200px] p-4 text-center">
          <div className="bg-gray-100 rounded-full p-4 mb-3">
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-700 font-medium mb-1">
            {activeTab === "unread"
              ? "Geen ongelezen notificaties"
              : "Geen notificaties"}
          </p>
          <p className="text-xs text-gray-500">
            We laten het je weten als er iets nieuws is
          </p>
        </div>
      );
    }

    return (
      <div>
        <AnimatePresence initial={false}>
          {notificationsList.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`relative ${
                notification.read ? "bg-white" : "bg-gray-50"
              }`}
            >
              {notification.actionUrl ? (
                <Link
                  href={notification.actionUrl}
                  className="block py-3 w-[90%] mx-auto hover:bg-gray-50 transition-colors"
                  onClick={() => handleNotificationClick(notification)}
                >
                  {renderNotificationContent(notification)}
                </Link>
              ) : (
                <div
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  {renderNotificationContent(notification)}
                </div>
              )}

              <button
                className="absolute top-3 right-3 p-1 rounded-full opacity-70 hover:opacity-100 hover:bg-gray-200 transition-all z-10"
                onClick={(e) => handleDelete(e, notification.id)}
                disabled={deletingIds.has(notification.id)}
              >
                {deletingIds.has(notification.id) ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  function renderNotificationContent(notification: Notification) {
    return (
      <div className="flex items-start gap-3 pr-5">
        <div className="flex-shrink-0 rounded-full bg-gray-200 p-2.5">
          {notificationIcons[notification.type] || notificationIcons.OTHER}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium mb-1.5 text-gray-800 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 flex items-center">
            {formatTime(notification.createdAt)}
            {notification.actionUrl && (
              <>
                <span className="mx-1.5 text-gray-300">•</span>
                <span className="text-primary">Bekijk details</span>
              </>
            )}
          </p>
        </div>
        {notification.actionUrl && (
          <ChevronRight className="h-4 w-4 text-gray-400 self-center flex-shrink-0 ml-auto" />
        )}
      </div>
    );
  }
}
