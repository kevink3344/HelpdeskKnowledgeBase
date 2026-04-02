import { Router, type IRouter } from "express";
import { eq, count, sql, desc } from "drizzle-orm";
import { db, ticketsTable, kbArticlesTable, activityLogTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/dashboard", async (_req, res): Promise<void> => {
  const [stats] = await db
    .select({
      totalTickets: count(ticketsTable.id),
      openTickets: sql<number>`cast(sum(case when ${ticketsTable.status} = 'open' then 1 else 0 end) as int)`,
      inProgressTickets: sql<number>`cast(sum(case when ${ticketsTable.status} = 'in_progress' then 1 else 0 end) as int)`,
      resolvedTickets: sql<number>`cast(sum(case when ${ticketsTable.status} = 'resolved' then 1 else 0 end) as int)`,
      closedTickets: sql<number>`cast(sum(case when ${ticketsTable.status} = 'closed' then 1 else 0 end) as int)`,
      urgentTickets: sql<number>`cast(sum(case when ${ticketsTable.priority} = 'urgent' then 1 else 0 end) as int)`,
      avgResolutionHours: sql<number | null>`avg(extract(epoch from (${ticketsTable.resolvedAt} - ${ticketsTable.createdAt})) / 3600)`,
    })
    .from(ticketsTable);

  const [kbStats] = await db
    .select({ totalKbArticles: count(kbArticlesTable.id) })
    .from(kbArticlesTable)
    .where(eq(kbArticlesTable.published, true));

  res.json({
    totalTickets: Number(stats?.totalTickets ?? 0),
    openTickets: Number(stats?.openTickets ?? 0),
    inProgressTickets: Number(stats?.inProgressTickets ?? 0),
    resolvedTickets: Number(stats?.resolvedTickets ?? 0),
    closedTickets: Number(stats?.closedTickets ?? 0),
    urgentTickets: Number(stats?.urgentTickets ?? 0),
    avgResolutionHours: stats?.avgResolutionHours != null ? Number(stats.avgResolutionHours) : null,
    totalKbArticles: Number(kbStats?.totalKbArticles ?? 0),
  });
});

router.get("/stats/tickets-by-status", async (_req, res): Promise<void> => {
  const results = await db
    .select({
      status: ticketsTable.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(ticketsTable)
    .groupBy(ticketsTable.status);

  res.json(results);
});

router.get("/stats/recent-activity", async (_req, res): Promise<void> => {
  const activities = await db
    .select()
    .from(activityLogTable)
    .orderBy(desc(activityLogTable.createdAt))
    .limit(20);

  res.json(
    activities.map((a) => ({
      id: String(a.id),
      type: a.type,
      description: a.description,
      ticketId: a.ticketId,
      ticketTitle: a.ticketTitle,
      createdAt: a.createdAt,
    }))
  );
});

export default router;
