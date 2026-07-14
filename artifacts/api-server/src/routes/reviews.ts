import { Router, type IRouter } from "express";
import { eq, sql, and, avg } from "drizzle-orm";
import { db, reviewsTable, usersTable, notificationsTable } from "@workspace/db";
import {
  GetUserReviewsParams,
  GetUserReviewsResponse,
  CreateReviewParams,
  CreateReviewBody,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /reviews/:userId
router.get("/reviews/:userId", requireAuth, async (req, res): Promise<void> => {
  const params = GetUserReviewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.revieweeUserId, params.data.userId));

  const enriched = await Promise.all(
    reviews.map(async (r) => {
      const [reviewer] = await db.select().from(usersTable).where(eq(usersTable.id, r.reviewerUserId));
      return {
        ...r,
        reviewerName: reviewer?.name ?? "Unknown",
        reviewerAvatarUrl: reviewer?.avatarUrl ?? null,
      };
    })
  );

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
      : null;

  res.json(
    GetUserReviewsResponse.parse({
      reviews: enriched,
      averageRating,
      total: reviews.length,
    })
  );
});

// POST /reviews/:userId
router.post("/reviews/:userId", requireAuth, async (req, res): Promise<void> => {
  const reviewerId = (req as AuthenticatedRequest).userId;

  const params = CreateReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (reviewerId === params.data.userId) {
    res.status(400).json({ error: "Cannot review yourself" });
    return;
  }

  // Upsert review (one review per pair)
  const [existing] = await db
    .select()
    .from(reviewsTable)
    .where(
      and(
        eq(reviewsTable.reviewerUserId, reviewerId),
        eq(reviewsTable.revieweeUserId, params.data.userId)
      )
    );

  let review;
  if (existing) {
    [review] = await db
      .update(reviewsTable)
      .set({ rating: parsed.data.rating, comment: parsed.data.comment ?? null })
      .where(eq(reviewsTable.id, existing.id))
      .returning();
  } else {
    [review] = await db
      .insert(reviewsTable)
      .values({
        reviewerUserId: reviewerId,
        revieweeUserId: params.data.userId,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      })
      .returning();

    // Notify reviewee
    const [reviewer] = await db.select().from(usersTable).where(eq(usersTable.id, reviewerId));
    await db.insert(notificationsTable).values({
      userId: params.data.userId,
      type: "new_review",
      title: "New review",
      body: `${reviewer?.name ?? "Someone"} left you a ${parsed.data.rating}-star review`,
      relatedUserId: reviewerId,
    });
  }

  const [reviewer] = await db.select().from(usersTable).where(eq(usersTable.id, reviewerId));
  res.status(201).json({
    ...review,
    reviewerName: reviewer?.name ?? "Unknown",
    reviewerAvatarUrl: reviewer?.avatarUrl ?? null,
  });
});

export default router;
