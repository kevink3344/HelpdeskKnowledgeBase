import { Router, type IRouter } from "express";
import { eq, desc, ilike, and } from "drizzle-orm";
import { db, kbArticlesTable, activityLogTable } from "@workspace/db";
import {
  ListKbArticlesQueryParams,
  CreateKbArticleBody,
  GetKbArticleParams,
  UpdateKbArticleParams,
  UpdateKbArticleBody,
  DeleteKbArticleParams,
  IncrementKbArticleViewsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/kb/articles", async (req, res): Promise<void> => {
  const parsed = ListKbArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, category, published } = parsed.data;

  const conditions = [];
  if (published !== undefined) conditions.push(eq(kbArticlesTable.published, published));
  if (category) conditions.push(eq(kbArticlesTable.category, category));
  if (search) {
    conditions.push(
      ilike(kbArticlesTable.title, `%${search}%`)
    );
  }

  const articles = await db
    .select()
    .from(kbArticlesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(kbArticlesTable.createdAt));

  res.json(articles);
});

router.post("/kb/articles", async (req, res): Promise<void> => {
  const parsed = CreateKbArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [article] = await db.insert(kbArticlesTable).values(parsed.data).returning();

  await db.insert(activityLogTable).values({
    type: "kb_article_created",
    description: `New KB article published: "${article.title}"`,
    ticketId: null,
    ticketTitle: null,
  });

  res.status(201).json(article);
});

router.get("/kb/articles/:id", async (req, res): Promise<void> => {
  const params = GetKbArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db
    .select()
    .from(kbArticlesTable)
    .where(eq(kbArticlesTable.id, params.data.id));

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json(article);
});

router.patch("/kb/articles/:id", async (req, res): Promise<void> => {
  const params = UpdateKbArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateKbArticleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [article] = await db
    .update(kbArticlesTable)
    .set(parsed.data)
    .where(eq(kbArticlesTable.id, params.data.id))
    .returning();

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json(article);
});

router.delete("/kb/articles/:id", async (req, res): Promise<void> => {
  const params = DeleteKbArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db
    .delete(kbArticlesTable)
    .where(eq(kbArticlesTable.id, params.data.id))
    .returning();

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/kb/articles/:id/view", async (req, res): Promise<void> => {
  const params = IncrementKbArticleViewsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(kbArticlesTable)
    .where(eq(kbArticlesTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  const [updated] = await db
    .update(kbArticlesTable)
    .set({ viewCount: existing.viewCount + 1 })
    .where(eq(kbArticlesTable.id, params.data.id))
    .returning();

  res.json(updated);
});

export default router;
