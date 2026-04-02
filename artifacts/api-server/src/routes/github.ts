import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { db, ticketsTable, commentsTable, attachmentsTable } from "@workspace/db";
import {
  LinkTicketToGithubIssueBody,
  CreateGithubIssueBody,
  ListGithubIssuesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getConnectors() {
  return new ReplitConnectors();
}

router.get("/github/repos", async (req, res): Promise<void> => {
  const connectors = getConnectors();
  const response = await connectors.proxy("github", "/user/repos?per_page=100&sort=updated", {
    method: "GET",
  });

  if (!response.ok) {
    req.log.error({ status: response.status }, "GitHub API error fetching repos");
    res.status(response.status).json({ error: "Failed to fetch GitHub repos" });
    return;
  }

  const data = await response.json() as any[];
  const repos = data.map((r: any) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description ?? null,
    htmlUrl: r.html_url,
    private: r.private,
    openIssuesCount: r.open_issues_count,
  }));

  res.json(repos);
});

router.get("/github/repos/:owner/:repo/issues", async (req, res): Promise<void> => {
  const { owner, repo } = req.params;
  const parsed = ListGithubIssuesQueryParams.safeParse(req.query);
  const state = parsed.success && parsed.data.state ? parsed.data.state : "open";

  const connectors = getConnectors();
  const response = await connectors.proxy(
    "github",
    `/repos/${owner}/${repo}/issues?state=${state}&per_page=50`,
    { method: "GET" }
  );

  if (!response.ok) {
    req.log.error({ status: response.status }, "GitHub API error fetching issues");
    res.status(response.status).json({ error: "Failed to fetch GitHub issues" });
    return;
  }

  const data = await response.json() as any[];
  const issues = data
    .filter((i: any) => !i.pull_request)
    .map((i: any) => ({
      id: i.id,
      number: i.number,
      title: i.title,
      body: i.body ?? null,
      state: i.state,
      htmlUrl: i.html_url,
      labels: (i.labels ?? []).map((l: any) => l.name),
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    }));

  res.json(issues);
});

router.post("/github/repos/:owner/:repo/issues", async (req, res): Promise<void> => {
  const { owner, repo } = req.params;
  const parsed = CreateGithubIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, body, ticketId, labels } = parsed.data;

  const connectors = getConnectors();
  const response = await connectors.proxy(
    "github",
    `/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body: `${body}\n\n---\n*Created from SupportDesk ticket #${ticketId}*`,
        labels: labels ?? [],
      }),
    }
  );

  if (!response.ok) {
    req.log.error({ status: response.status }, "GitHub API error creating issue");
    res.status(response.status).json({ error: "Failed to create GitHub issue" });
    return;
  }

  const issue = await response.json() as any;

  await db
    .update(ticketsTable)
    .set({
      githubIssueUrl: issue.html_url,
      githubIssueNumber: issue.number,
      githubRepo: `${owner}/${repo}`,
    })
    .where(eq(ticketsTable.id, ticketId));

  const issueOut = {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body ?? null,
    state: issue.state,
    htmlUrl: issue.html_url,
    labels: (issue.labels ?? []).map((l: any) => l.name),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  };

  res.status(201).json(issueOut);
});

router.post("/tickets/:id/github-link", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket id" });
    return;
  }

  const parsed = LinkTicketToGithubIssueBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { issueNumber, issueUrl, repo } = parsed.data;

  const [ticket] = await db
    .update(ticketsTable)
    .set({
      githubIssueUrl: issueUrl,
      githubIssueNumber: issueNumber,
      githubRepo: repo,
    })
    .where(eq(ticketsTable.id, id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const [counts] = await db
    .select({
      attachmentCount: sql<number>`cast(count(distinct ${attachmentsTable.id}) as int)`,
      commentCount: sql<number>`cast(count(distinct ${commentsTable.id}) as int)`,
    })
    .from(ticketsTable)
    .leftJoin(attachmentsTable, eq(attachmentsTable.ticketId, ticketsTable.id))
    .leftJoin(commentsTable, eq(commentsTable.ticketId, ticketsTable.id))
    .where(eq(ticketsTable.id, id))
    .groupBy(ticketsTable.id);

  res.json({
    ...ticket,
    attachmentCount: counts?.attachmentCount ?? 0,
    commentCount: counts?.commentCount ?? 0,
  });
});

router.delete("/tickets/:id/github-link", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket id" });
    return;
  }

  const [ticket] = await db
    .update(ticketsTable)
    .set({
      githubIssueUrl: null,
      githubIssueNumber: null,
      githubRepo: null,
    })
    .where(eq(ticketsTable.id, id))
    .returning();

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const [counts] = await db
    .select({
      attachmentCount: sql<number>`cast(count(distinct ${attachmentsTable.id}) as int)`,
      commentCount: sql<number>`cast(count(distinct ${commentsTable.id}) as int)`,
    })
    .from(ticketsTable)
    .leftJoin(attachmentsTable, eq(attachmentsTable.ticketId, ticketsTable.id))
    .leftJoin(commentsTable, eq(commentsTable.ticketId, ticketsTable.id))
    .where(eq(ticketsTable.id, id))
    .groupBy(ticketsTable.id);

  res.json({
    ...ticket,
    attachmentCount: counts?.attachmentCount ?? 0,
    commentCount: counts?.commentCount ?? 0,
  });
});

export default router;
