import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import ChatDrawer from "@/components/chat/chat-drawer";
import NotificationsDropdown from "@/components/constants/notifications-dropdown";
import { LanguageDropdown } from "@/components/ui/language-dropdown";

export const DesktopActions = ({
  user,
  totalUnreadCount,
  openChatDrawer,
  setOpenChatDrawer,
}: any) => {
  return (
    <>
      <div className="me-1">
        <LanguageDropdown />
      </div>

      {user && (
        <>
          <ChatDrawer
            trigger={
              <Button
                variant="outline"
                size="icon"
                className="rounded-full shadow-none me-3 relative"
              >
                <MessageCircle strokeWidth={1.5} />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px]">
                    {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                  </span>
                )}
              </Button>
            }
          />
          <NotificationsDropdown />
        </>
      )}
    </>
  );
};
