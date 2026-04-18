import { Link } from "wouter";
import { MessageSquare, Circle } from "lucide-react";
import { useListConversations, getListConversationsQueryKey } from "@workspace/api-client-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Conversation } from "@workspace/api-client-react";

function ConversationItem({ conv }: { conv: Conversation }) {
  const timeStr = conv.lastMessageAt
    ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Link href={`/chat/${conv.otherUserId}`}>
      <div className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer border-b border-border last:border-0">
        <div className="relative flex-shrink-0">
          {conv.otherUserAvatarUrl ? (
            <img src={conv.otherUserAvatarUrl} alt={conv.otherUserName} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg font-bold">
              {conv.otherUserName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className={`font-semibold text-sm ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground/80"}`}>
              {conv.otherUserName}
            </p>
            {timeStr && <span className="text-xs text-muted-foreground">{timeStr}</span>}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground truncate flex-1">
              {conv.lastMessage ?? "No messages yet"}
            </p>
            {conv.unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium flex-shrink-0">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground/60">{conv.otherUserRole}</p>
        </div>
      </div>
    </Link>
  );
}

export default function ChatList() {
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useListConversations();

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
    }, 5000);
    return () => clearInterval(interval);
  }, [queryClient]);

  return (
    <div className="max-w-2xl mx-auto px-0 sm:px-4 py-0 sm:py-6">
      <div className="bg-card border-0 sm:border border-border sm:rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h1 className="text-lg font-bold text-foreground">Messages</h1>
        </div>

        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 animate-pulse border-b border-border">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No conversations yet</p>
            <p className="text-sm mt-1">Browse the feed and start a conversation</p>
          </div>
        ) : (
          <div>
            {conversations.map((conv) => (
              <ConversationItem key={conv.id} conv={conv} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
