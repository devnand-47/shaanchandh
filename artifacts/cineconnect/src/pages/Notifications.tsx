import { Bell, Check, MessageSquare, Briefcase, Star, User } from "lucide-react";
import {
  useListNotifications, useMarkAllNotificationsRead, useMarkNotificationRead,
  getListNotificationsQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Notification } from "@workspace/api-client-react";

const notifIcon = {
  new_message: MessageSquare,
  new_project: Briefcase,
  profile_view: User,
  new_application: Briefcase,
  new_review: Star,
};

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: number) => void }) {
  const Icon = notifIcon[notif.type as keyof typeof notifIcon] ?? Bell;
  return (
    <div
      className={`flex items-start gap-4 p-4 border-b border-border last:border-0 transition-colors ${
        notif.isRead ? "opacity-60" : "bg-primary/5"
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        notif.isRead ? "bg-muted" : "bg-primary/10"
      }`}>
        <Icon className={`w-5 h-5 ${notif.isRead ? "text-muted-foreground" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{notif.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          {new Date(notif.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
        </p>
      </div>
      {!notif.isRead && (
        <button
          onClick={() => onRead(notif.id)}
          className="text-muted-foreground hover:text-primary transition-colors p-1"
          title="Mark as read"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  // Poll for new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    }, 5000);
    return () => clearInterval(interval);
  }, [queryClient]);

  const handleMarkAll = () => {
    markAll.mutate({} as any, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const handleMarkOne = (id: number) => {
    markOne.mutate({ params: { notificationId: id } } as any, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-0 sm:px-4 py-0 sm:py-6">
      <div className="bg-card border-0 sm:border border-border sm:rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h1 className="text-lg font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAll} className="text-muted-foreground hover:text-foreground text-xs">
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 animate-pulse border-b border-border">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">We'll notify you when something happens</p>
          </div>
        ) : (
          <div>
            {notifications.map((notif) => (
              <NotifItem key={notif.id} notif={notif} onRead={handleMarkOne} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
