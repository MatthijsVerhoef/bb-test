import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Truck,
  Calendar,
  Star,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

interface NotificationsProps {
  notifications: {
    id: string;
    message: string;
    read: boolean;
    type: string;
    createdAt: Date;
  }[];
}

export default function Notifications({ notifications }: NotificationsProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);

    // If today, show time
    if (notificationDate.toDateString() === now.toDateString()) {
      return `Today at ${notificationDate.toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (notificationDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${notificationDate.toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Otherwise show full date
    return notificationDate.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "RENTAL":
        return <Calendar className="w-5 h-5 text-primary" />;
      case "MESSAGE":
        return <MessageSquare className="w-5 h-5 text-primary" />;
      case "PAYMENT":
        return <CreditCard className="w-5 h-5 text-primary" />;
      case "REVIEW":
        return <Star className="w-5 h-5 text-primary" />;
      case "TRAILER":
        return <Truck className="w-5 h-5 text-primary" />;
      case "VERIFICATION":
        return <ShieldCheck className="w-5 h-5 text-primary" />;
      case "ALERT":
        return <AlertCircle className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    // In a real app, this would be an API call to update the database
    console.log("Marking all notifications as read");
  };

  // Filter notifications
  const filteredNotifications = filter
    ? notifications.filter((notification) => notification.type === filter)
    : notifications;

  // Get unique notification types for filter
  const notificationTypes = Array.from(
    new Set(notifications.map((n) => n.type))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with important account activities
          </p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter(null)}
        >
          All
        </Button>
        {notificationTypes.map((type) => (
          <Button
            key={type}
            variant={filter === type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(type)}
            className="flex items-center"
          >
            {getNotificationIcon(type)}
            <span className="ml-1 capitalize">{type.toLowerCase()}</span>
          </Button>
        ))}
      </div>

      {filteredNotifications.length > 0 ? (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.read ? "bg-white" : "bg-blue-50/50"}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-start">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      notification.read ? "bg-muted" : "bg-primary/10"
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div>
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
                {!notification.read && (
                  <Badge
                    variant="default"
                    className="rounded-full w-2 h-2 p-0"
                  ></Badge>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Load more button if there are many notifications */}
          {notifications.length > 10 && (
            <div className="flex justify-center mt-4">
              <Button variant="outline">Load More</Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Bell className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">No Notifications</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {filter
                ? `You don't have any ${filter.toLowerCase()} notifications at the moment.`
                : "You don't have any notifications at the moment."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
