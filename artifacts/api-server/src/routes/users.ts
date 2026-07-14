import { Router, type IRouter } from "express";
import { eq, ilike, sql, and, or, desc, ne } from "drizzle-orm";
import { db, usersTable, reviewsTable } from "@workspace/db";
import { clerkClient } from "@clerk/express";
import {
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
  ListUsersQueryParams,
  ListUsersResponse,
  GetUserByIdParams,
  GetUserByIdResponse,
  RecordProfileViewParams,
  RecordProfileViewResponse,
  BlockUserParams,
  BlockUserResponse,
  GetFeedStatsResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";
import { notificationsTable } from "@workspace/db";

const router: IRouter = Router();

async function getUserWithStats(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;

  const reviewRows = await db
    .select({ rating: reviewsTable.rating })
    .from(reviewsTable)
    .where(eq(reviewsTable.revieweeUserId, userId));

  const averageRating =
    reviewRows.length > 0
      ? reviewRows.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewRows.length
      : null;

  return {
    ...user,
    averageRating,
    totalReviews: reviewRows.length,
    totalProjectsPosted: 0,
  };
}

// GET /users/me — current user profile
router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;

  let userWithStats = await getUserWithStats(userId);

  if (!userWithStats) {
    // Auto-create profile from Clerk info
    let name = "New User";
    let email = "";
    let avatarUrl: string | null = null;
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      const firstName = clerkUser.firstName ?? "";
      const lastName = clerkUser.lastName ?? "";
      name = [firstName, lastName].filter(Boolean).join(" ") || clerkUser.username || "New User";
      email = clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
      avatarUrl = clerkUser.imageUrl ?? null;
    } catch {}
    const [newUser] = await db
      .insert(usersTable)
      .values({ id: userId, clerkId: userId, name, email, avatarUrl, role: "Other" })
      .returning();
    userWithStats = { ...newUser, averageRating: null, totalReviews: 0, totalProjectsPosted: 0 };
  }

  res.json(GetMeResponse.parse(userWithStats));
});

// PUT /users/me — update profile
router.put("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;

  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  let updated;
  if (existing) {
    [updated] = await db
      .update(usersTable)
      .set(parsed.data)
      .where(eq(usersTable.id, userId))
      .returning();
  } else {
    const clerkData = (req as any).auth?.sessionClaims;
    [updated] = await db
      .insert(usersTable)
      .values({
        id: userId,
        clerkId: userId,
        name: parsed.data.name || "New User",
        email: clerkData?.email || "",
        ...parsed.data,
      })
      .returning();
  }

  const userWithStats = await getUserWithStats(updated.id);
  res.json(UpdateMeResponse.parse(userWithStats));
});

// GET /users — list/search users
router.get("/users", requireAuth, async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { role, location, skill, search, page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (role) conditions.push(eq(usersTable.role, role));
  if (location) conditions.push(ilike(usersTable.location, `%${location}%`));
  if (search) {
    conditions.push(
      or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.bio, `%${search}%`))
    );
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(usersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const usersWithStats = await Promise.all(
    users.map(async (u: any) => {
      const reviewRows = await db
        .select({ rating: reviewsTable.rating })
        .from(reviewsTable)
        .where(eq(reviewsTable.revieweeUserId, u.id));
      return {
        ...u,
        averageRating:
          reviewRows.length > 0
            ? reviewRows.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviewRows.length
            : null,
        totalReviews: reviewRows.length,
        totalProjectsPosted: 0,
      };
    })
  );

  res.json(
    ListUsersResponse.parse({
      users: usersWithStats,
      total: countResult?.count ?? 0,
      page,
      limit,
    })
  );
});

// GET /users/:userId — get user by ID
router.get("/users/:userId", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userWithStats = await getUserWithStats(params.data.userId);
  if (!userWithStats) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserByIdResponse.parse(userWithStats));
});

// POST /users/:userId/view — record profile view
router.post("/users/:userId/view", requireAuth, async (req, res): Promise<void> => {
  const params = RecordProfileViewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const viewerId = (req as AuthenticatedRequest).userId;
  const targetUserId = params.data.userId;

  if (viewerId !== targetUserId) {
    // Create profile view notification
    await db.insert(notificationsTable).values({
      userId: targetUserId,
      type: "profile_view",
      title: "Someone viewed your profile",
      body: "A user viewed your profile",
      relatedUserId: viewerId,
    });
  }

  res.json(RecordProfileViewResponse.parse({ success: true }));
});

// POST /users/:userId/block — block a user
router.post("/users/:userId/block", requireAuth, async (req, res): Promise<void> => {
  const params = BlockUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  res.json(BlockUserResponse.parse({ success: true }));
});

// GET /users/stats/feed — feed stats
router.get("/users/stats/feed", requireAuth, async (req, res): Promise<void> => {
  const [totalResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(usersTable);

  const roleBreakdown = await db
    .select({
      role: usersTable.role,
      count: sql<number>`cast(count(*) as integer)`,
    })
    .from(usersTable)
    .groupBy(usersTable.role);

  const recentUsers = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(6);

  const recentJoiners = recentUsers.map((u: any) => ({
    ...u,
    averageRating: null,
    totalReviews: 0,
    totalProjectsPosted: 0,
  }));

  res.json(
    GetFeedStatsResponse.parse({
      totalUsers: totalResult?.count ?? 0,
      roleBreakdown,
      recentJoiners,
      activeProjects: 0,
    })
  );
});

export default router;
