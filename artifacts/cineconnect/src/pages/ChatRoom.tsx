import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Send } from "lucide-react";
import {
  useGetUserById,
  useSendMessage,
  useListConversations,
  useGetMessages,
  getListConversationsQueryKey,
  getGetMessagesQueryKey,
  useGetMe,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import type { Message, Conversation } from "@workspace/api-client-react";

export default function ChatRoom() {
  const { userId: recipientId } = useParams();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: me } = useGetMe();
  const { data: recipient } = useGetUserById(recipientId ?? "", {
    query: { enabled: !!recipientId },
  });
  const { data: conversations } = useListConversations();
  const sendMsg = useSendMessage();

  const { data: messages = [] } = useGetMessages(
    conversationId ?? 0,
    {},
    {
      query: {
        enabled: !!conversationId,
        queryKey: getGetMessagesQueryKey(conversationId ?? 0),
        refetchInterval: 3000,
      },
    }
  );

  useEffect(() => {
    if (!conversations || !recipientId) return;
    const conv = (conversations as Conversation[]).find((c) => c.otherUserId === recipientId);
    if (conv) setConversationId(conv.id);
  }, [conversations, recipientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !recipientId) return;
    const content = message.trim();
    setMessage("");
    sendMsg.mutate(
      { data: { recipientUserId: recipientId, content } } as any,
      {
        onSuccess: (msg: any) => {
          queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
          if (msg?.conversationId) {
            setConversationId(msg.conversationId);
            queryClient.invalidateQueries({
              queryKey: getGetMessagesQueryKey(msg.conversationId),
            });
          }
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[100dvh]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => navigate("/chat")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        {recipient ? (
          <>
            {recipient.avatarUrl ? (
              <img src={recipient.avatarUrl} alt={recipient.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {recipient.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm text-foreground">{recipient.name}</p>
              <p className="text-xs text-muted-foreground">{recipient.role}</p>
            </div>
          </>
        ) : (
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {(messages as Message[]).length === 0 ? (
          <div className="flex items-center justify-center text-center text-muted-foreground py-12">
            <div>
              <p className="font-medium">Start the conversation</p>
              <p className="text-sm mt-1">Say hello to {recipient?.name ?? "this person"}</p>
            </div>
          </div>
        ) : (
          (messages as Message[]).map((msg) => {
            const isMine = msg.senderUserId === me?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
                {!isMine && (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mt-1">
                    {msg.senderName.charAt(0)}
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-card flex-shrink-0">
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-background border-border"
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || sendMsg.isPending}
          size="icon"
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
