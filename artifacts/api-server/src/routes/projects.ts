import { Router, type IRouter } from "express";
import { eq, ilike, sql, and, or, desc, inArray } from "drizzle-orm";
import { db, projectsTable, usersTable, projectApplicationsTable, projectBookmarksTable, notificationsTable } from "@workspace/db";
import {
  ListProjectsQueryParams,
  ListProjectsResponse,
  CreateProjectBody,
  GetProjectParams,
  GetProjectResponse,
  UpdateProjectParams,
  UpdateProjectBody,
  UpdateProjectResponse,
  DeleteProjectParams,
  ApplyToProjectParams,
  ApplyToProjectBody,
  BookmarkProjectParams,
  BookmarkProjectResponse,
  GetMyBookmarksResponse,
  GetMyProjectsResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

async function enrichProject(
  project: typeof projectsTable.$inferSelect,
  userId: string
) {
  const [poster] = await db.select().from(usersTable).where(eq(usersTable.id, project.posterUserId));
  const [applicationCount] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(projectApplicationsTable)
    .where(eq(projectApplicationsTable.projectId, project.id));

  const [bookmark] = await db
    .select()
    .from(projectBookmarksTable)
    .where(
      and(
        eq(projectBookmarksTable.userId, userId),
        eq(projectBookmarksTable.projectId, project.id)
      )
    );

  return {
    ...project,
    posterName: poster?.name ?? "Unknown",
    posterAvatarUrl: poster?.avatarUrl ?? null,
    posterRole: poster?.role ?? "Other",
    applicationCount: applicationCount?.count ?? 0,
    isBookmarked: !!bookmark,
  };
}

// GET /projects
router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const params = ListProjectsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { role, location, search, page = 1, limit = 20 } = params.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(projectsTable.status, "open")];
  if (location) conditions.push(ilike(projectsTable.location, `%${location}%`));
  if (search) {
    conditions.push(
      or(
        ilike(projectsTable.title, `%${search}%`),
        ilike(projectsTable.description, `%${search}%`)
      )!
    );
  }

  const projects = await db
    .select()
    .from(projectsTable)
    .where(and(...conditions))
    .orderBy(desc(projectsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(projectsTable)
    .where(and(...conditions));

  const enriched = await Promise.all(projects.map((p: any) => enrichProject(p, userId)));

  res.json(
    ListProjectsResponse.parse({
      projects: enriched,
      total: countResult?.count ?? 0,
      page,
      limit,
    })
  );
});

// POST /projects
router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({ ...parsed.data, posterUserId: userId })
    .returning();

  const enriched = await enrichProject(project, userId);
  res.status(201).json(GetProjectResponse.parse(enriched));
});

// GET /projects/my/bookmarks
router.get("/projects/my/bookmarks", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;

  const bookmarks = await db
    .select({ projectId: projectBookmarksTable.projectId })
    .from(projectBookmarksTable)
    .where(eq(projectBookmarksTable.userId, userId));

  if (bookmarks.length === 0) {
    res.json(GetMyBookmarksResponse.parse([]));
    return;
  }

  const projectIds = bookmarks.map((b: any) => b.projectId);
  const projects = await db
    .select()
    .from(projectsTable)
    .where(inArray(projectsTable.id, projectIds));

  const enriched = await Promise.all(projects.map((p: any) => enrichProject(p, userId)));
  res.json(GetMyBookmarksResponse.parse(enriched));
});

// GET /projects/my/posts
router.get("/projects/my/posts", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;

  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.posterUserId, userId))
    .orderBy(desc(projectsTable.createdAt));

  const enriched = await Promise.all(projects.map((p: any) => enrichProject(p, userId)));
  res.json(GetMyProjectsResponse.parse(enriched));
});

// GET /projects/:projectId
router.get("/projects/:projectId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const projectId = parseInt(raw, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const enriched = await enrichProject(project, userId);
  res.json(GetProjectResponse.parse(enriched));
});

// PATCH /projects/:projectId
router.patch("/projects/:projectId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const projectId = parseInt(raw, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (existing.posterUserId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db
    .update(projectsTable)
    .set(parsed.data)
    .where(eq(projectsTable.id, projectId))
    .returning();

  const enriched = await enrichProject(updated, userId);
  res.json(UpdateProjectResponse.parse(enriched));
});

// DELETE /projects/:projectId
router.delete("/projects/:projectId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const projectId = parseInt(raw, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const [existing] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  if (existing.posterUserId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
  res.sendStatus(204);
});

// POST /projects/:projectId/apply
router.post("/projects/:projectId/apply", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const projectId = parseInt(raw, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const parsed = ApplyToProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [application] = await db
    .insert(projectApplicationsTable)
    .values({
      projectId,
      applicantUserId: userId,
      message: parsed.data.message,
      status: "pending",
    })
    .returning();

  // Notify project poster
  const [applicant] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  await db.insert(notificationsTable).values({
    userId: project.posterUserId,
    type: "new_application",
    title: "New application on your project",
    body: `${applicant?.name ?? "Someone"} applied to "${project.title}"`,
    relatedUserId: userId,
    relatedProjectId: projectId,
  });

  res.status(201).json({
    id: application.id,
    projectId: application.projectId,
    applicantUserId: application.applicantUserId,
    message: application.message,
    status: application.status,
    createdAt: application.createdAt.toISOString(),
  });
});

// POST /projects/:projectId/bookmark
router.post("/projects/:projectId/bookmark", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as AuthenticatedRequest).userId;
  const raw = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
  const projectId = parseInt(raw, 10);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(projectBookmarksTable)
    .where(
      and(
        eq(projectBookmarksTable.userId, userId),
        eq(projectBookmarksTable.projectId, projectId)
      )
    );

  if (existing) {
    await db
      .delete(projectBookmarksTable)
      .where(
        and(
          eq(projectBookmarksTable.userId, userId),
          eq(projectBookmarksTable.projectId, projectId)
        )
      );
    res.json(BookmarkProjectResponse.parse({ bookmarked: false }));
  } else {
    await db.insert(projectBookmarksTable).values({ userId, projectId });
    res.json(BookmarkProjectResponse.parse({ bookmarked: true }));
  }
});

export default router;
