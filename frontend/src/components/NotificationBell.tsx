import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, CheckCheck, CheckCircle2, FileText, HelpCircle, MessageSquare, Mail } from "lucide-react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  Notification,
} from "@/lib/notifications-api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count:", getErrorMessage(error));
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      // Filter to only show relevant notifications in the bell
      const filtered = data.filter(n =>
        n.type === 'INBOX_MESSAGE' ||
        n.type === 'GRADE_POSTED' ||
        n.type === 'NEW_QUIZ'
      );
      setNotifications(filtered);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        toast({
          title: "Error",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    }

    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "h-5 w-5 text-muted-foreground";
    switch (type) {
      case 'NEW_ASSIGNMENT':
        return <FileText className={iconClass} />;
      case 'NEW_QUIZ':
        return <HelpCircle className={iconClass} />;
      case 'GRADE_POSTED':
        return <CheckCircle2 className={iconClass} />;
      case 'DISCUSSION_REPLY':
        return <MessageSquare className={iconClass} />;
      case 'INBOX_MESSAGE':
        return <Mail className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                    !notification.isRead && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 flex items-center">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            !notification.isRead && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {notification.createdAt ? (() => {
                          try {
                            return format(parseISO(notification.createdAt), "MMM d, h:mm a");
                          } catch (e) {
                            return "";
                          }
                        })() : "Recent"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
