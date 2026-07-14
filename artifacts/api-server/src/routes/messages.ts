import { Router, type IRouter } from "express";
import { eq, or, and, desc, sql, lt } from "drizzle-orm";
import { db, conversationsTable, messagesTable, usersTable, notificationsTable } from "@workspace/db";
import {
  GetMessagesParams,
  GetMessagesQueryParams,
  GetMessagesResponse,
  ListConversationsResponse,
  SendMessageBody,
  GetUnreadCountResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /messages/conversations
router.get("/messages/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;

  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        eq(conversationsTable.user1Id, userId),
        eq(conversationsTable.user2Id, userId)
      )
    )
    .orderBy(desc(conversationsTable.updatedAt));

  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      const [otherUser] = await db.select().from(usersTable).where(eq(usersTable.id, otherUserId));

      const [lastMsg] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.conversationId, conv.id))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      const [unreadCount] = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.conversationId, conv.id),
            eq(messagesTable.isRead, false),
            // Only count messages NOT sent by current user
            sql`${messagesTable.senderUserId} != ${userId}`
          )
        );

      return {
        id: conv.id,
        otherUserId,
        otherUserName: otherUser?.name ?? "Unknown",
        otherUserAvatarUrl: otherUser?.avatarUrl ?? null,
        otherUserRole: otherUser?.role ?? "Other",
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.createdAt?.toISOString() ?? null,
        unreadCount: unreadCount?.count ?? 0,
      };
    })
  );

  res.json(ListConversationsResponse.parse(enriched));
});

// GET /messages/unread-count
router.get("/messages/unread-count", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;

  const myConversations = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(
      or(
        eq(conversationsTable.user1Id, userId),
        eq(conversationsTable.user2Id, userId)
      )
    );

  if (myConversations.length === 0) {
    res.json(GetUnreadCountResponse.parse({ count: 0 }));
    return;
  }

  const convIds = myConversations.map((c: any) => c.id);
  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(messagesTable)
    .where(
      and(
        eq(messagesTable.isRead, false),
        sql`${messagesTable.senderUserId} != ${userId}`,
        sql`${messagesTable.conversationId} = ANY(${convIds}::int[])`
      )
    );

  res.json(GetUnreadCountResponse.parse({ count: result?.count ?? 0 }));
});

// GET /messages/conversations/:conversationId
router.get("/messages/conversations/:conversationId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const raw = Array.isArray(req.params.conversationId) ? req.params.conversationId[0] : req.params.conversationId;
  const conversationId = parseInt(raw, 10);
  if (isNaN(conversationId)) {
    res.status(400).json({ error: "Invalid conversation ID" });
    return;
  }

  const queryParams = GetMessagesQueryParams.safeParse(req.query);
  const limitVal = queryParams.success ? (queryParams.data.limit ?? 50) : 50;

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversationId))
    .orderBy(desc(messagesTable.createdAt))
    .limit(limitVal);

  // Enrich with sender info
  const enriched = await Promise.all(
    messages.reverse().map(async (msg) => {
      const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, msg.senderUserId));
      return {
        ...msg,
        senderName: sender?.name ?? "Unknown",
        senderAvatarUrl: sender?.avatarUrl ?? null,
      };
    })
  );

  // Mark messages as read
  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(
      and(
        eq(messagesTable.conversationId, conversationId),
        eq(messagesTable.isRead, false),
        sql`${messagesTable.senderUserId} != ${userId}`
      )
    );

  res.json(GetMessagesResponse.parse(enriched));
});

// POST /messages/send
router.post("/messages/send", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { recipientUserId, content } = parsed.data;

  // Find or create conversation
  let [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        and(
          eq(conversationsTable.user1Id, userId),
          eq(conversationsTable.user2Id, recipientUserId)
        ),
        and(
          eq(conversationsTable.user1Id, recipientUserId),
          eq(conversationsTable.user2Id, userId)
        )
      )
    );

  if (!conversation) {
    [conversation] = await db
      .insert(conversationsTable)
      .values({ user1Id: userId, user2Id: recipientUserId })
      .returning();
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      conversationId: conversation.id,
      senderUserId: userId,
      content,
      isRead: false,
    })
    .returning();

  // Update conversation timestamp
  await db
    .update(conversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(conversationsTable.id, conversation.id));

  // Create notification for recipient
  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await db.insert(notificationsTable).values({
    userId: recipientUserId,
    type: "new_message",
    title: "New message",
    body: `${sender?.name ?? "Someone"} sent you a message`,
    relatedUserId: userId,
  });

  const enrichedMsg = {
    ...message,
    senderName: sender?.name ?? "Unknown",
    senderAvatarUrl: sender?.avatarUrl ?? null,
  };

  res.status(201).json(enrichedMsg);
});

export default router;
