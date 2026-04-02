import { Router, type IRouter } from "express";
import { eq, desc, sql, ilike, and, or } from "drizzle-orm";
import { db, ticketsTable, commentsTable, attachmentsTable, activityLogTable } from "@workspace/db";
import {
  ListTicketsQueryParams,
  CreateTicketBody,
  GetTicketParams,
  UpdateTicketParams,
  UpdateTicketBody,
  DeleteTicketParams,
  ListCommentsParams,
  CreateCommentParams,
  CreateCommentBody,
  ListAttachmentsParams,
  DeleteAttachmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tickets", async (req, res): Promise<void> => {
  const parsed = ListTicketsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, priority, category, search, assigneeId } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(ticketsTable.status, status));
  if (priority) conditions.push(eq(ticketsTable.priority, priority));
  if (category) conditions.push(eq(ticketsTable.category, category));
  if (assigneeId != null) conditions.push(eq(ticketsTable.assigneeId, assigneeId));
  if (search) {
    conditions.push(
      or(
        ilike(ticketsTable.title, `%${search}%`),
        ilike(ticketsTable.description, `%${search}%`),
        ilike(ticketsTable.submitterName, `%${search}%`),
        ilike(ticketsTable.submitterEmail, `%${search}%`)
      )
    );
  }

  const tickets = await db
    .select({
      id: ticketsTable.id,
      title: ticketsTable.title,
      description: ticketsTable.description,
      status: ticketsTable.status,
      priority: ticketsTable.priority,
      category: ticketsTable.category,
      submitterName: ticketsTable.submitterName,
      submitterEmail: ticketsTable.submitterEmail,
      assigneeId: ticketsTable.assigneeId,
      assigneeName: ticketsTable.assigneeName,
      resolvedAt: ticketsTable.resolvedAt,
      createdAt: ticketsTable.createdAt,
      updatedAt: ticketsTable.updatedAt,
      attachmentCount: sql<number>`cast(count(distinct ${attachmentsTable.id}) as int)`,
      commentCount: sql<number>`cast(count(distinct ${commentsTable.id}) as int)`,
    })
    .from(ticketsTable)
    .leftJoin(attachmentsTable, eq(attachmentsTable.ticketId, ticketsTable.id))
    .leftJoin(commentsTable, eq(commentsTable.ticketId, ticketsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(ticketsTable.id)
    .orderBy(desc(ticketsTable.createdAt));

  res.json(tickets);
});

router.post("/tickets", async (req, res): Promise<void> => {
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [ticket] = await db.insert(ticketsTable).values(parsed.data).returning();

  await db.insert(activityLogTable).values({
    type: "ticket_created",
    description: `New ticket submitted: "${ticket.title}"`,
    ticketId: ticket.id,
    ticketTitle: ticket.title,
  });

  res.status(201).json({ ...ticket, attachmentCount: 0, commentCount: 0 });
});

router.get("/tickets/:id", async (req, res): Promise<void> => {
  const params = GetTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ticket] = await db
    .select()
    .from(ticketsTable)
    .where(eq(ticketsTable.id, params.data.id));

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.ticketId, ticket.id))
    .orderBy(commentsTable.createdAt);

  const attachments = await db
    .select()
    .from(attachmentsTable)
    .where(eq(attachmentsTable.ticketId, ticket.id))
    .orderBy(attachmentsTable.createdAt);

  res.json({ ...ticket, comments, attachments });
});

router.patch("/tickets/:id", async (req, res): Promise<void> => {
  const params = UpdateTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.status === "resolved" || parsed.data.status === "closed") {
    const [existing] = await db
      .select()
      .from(ticketsTable)
      .where(eq(ticketsTable.id, params.data.id));
    if (existing && existing.status !== "resolved" && existing.status !== "closed") {
      updateData.resolvedAt = new Date();
    }
  }

  const [ticket] = await db
    .update(ticketsTable)
    .set(updateData)
    .where(eq(ticketsTable.id, params.data.id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const activityType = parsed.data.status === "resolved" ? "ticket_resolved" : "ticket_updated";
  const activityDesc = parsed.data.status
    ? `Ticket status changed to ${parsed.data.status}: "${ticket.title}"`
    : `Ticket updated: "${ticket.title}"`;

  await db.insert(activityLogTable).values({
    type: activityType,
    description: activityDesc,
    ticketId: ticket.id,
    ticketTitle: ticket.title,
  });

  const [counts] = await db
    .select({
      attachmentCount: sql<number>`cast(count(distinct ${attachmentsTable.id}) as int)`,
      commentCount: sql<number>`cast(count(distinct ${commentsTable.id}) as int)`,
    })
    .from(ticketsTable)
    .leftJoin(attachmentsTable, eq(attachmentsTable.ticketId, ticketsTable.id))
    .leftJoin(commentsTable, eq(commentsTable.ticketId, ticketsTable.id))
    .where(eq(ticketsTable.id, ticket.id))
    .groupBy(ticketsTable.id);

  res.json({
    ...ticket,
    attachmentCount: counts?.attachmentCount ?? 0,
    commentCount: counts?.commentCount ?? 0,
  });
});

router.delete("/tickets/:id", async (req, res): Promise<void> => {
  const params = DeleteTicketParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ticket] = await db
    .delete(ticketsTable)
    .where(eq(ticketsTable.id, params.data.id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/tickets/:id/comments", async (req, res): Promise<void> => {
  const params = ListCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.ticketId, params.data.id))
    .orderBy(commentsTable.createdAt);

  res.json(comments);
});

router.post("/tickets/:id/comments", async (req, res): Promise<void> => {
  const params = CreateCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [ticket] = await db
    .select()
    .from(ticketsTable)
    .where(eq(ticketsTable.id, params.data.id));

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values({ ...parsed.data, ticketId: params.data.id })
    .returning();

  if (!parsed.data.isInternal) {
    await db.insert(activityLogTable).values({
      type: "comment_added",
      description: `${parsed.data.authorName} replied on ticket: "${ticket.title}"`,
      ticketId: ticket.id,
      ticketTitle: ticket.title,
    });
  }

  res.status(201).json(comment);
});

router.get("/tickets/:id/attachments", async (req, res): Promise<void> => {
  const params = ListAttachmentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const attachments = await db
    .select()
    .from(attachmentsTable)
    .where(eq(attachmentsTable.ticketId, params.data.id))
    .orderBy(attachmentsTable.createdAt);

  res.json(attachments);
});

export default router;
