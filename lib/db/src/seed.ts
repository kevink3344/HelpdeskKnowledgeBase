import { db, ticketsTable, commentsTable, attachmentsTable, kbArticlesTable, activityLogTable } from "./index";

async function seed() {
  console.log("Clearing existing data...");
  await db.delete(activityLogTable);
  await db.delete(attachmentsTable);
  await db.delete(commentsTable);
  await db.delete(kbArticlesTable);
  await db.delete(ticketsTable);

  console.log("Seeding tickets...");
  const tickets = await db.insert(ticketsTable).values([
    {
      title: "Cannot log into my account",
      description: "I have been trying to log in for the past 2 hours but keep getting an \"invalid credentials\" error even though I am sure my password is correct. I tried resetting it twice already.",
      status: "in_progress",
      priority: "urgent",
      category: "Authentication",
      submitterName: "Sarah Mitchell",
      submitterEmail: "sarah.mitchell@example.com",
      assigneeId: 1,
      assigneeName: "Alex Chen",
    },
    {
      title: "Invoice shows wrong billing address",
      description: "The invoice I received last month has my old address on it. I updated my address in account settings 3 months ago but it still shows the old one on invoices.",
      status: "open",
      priority: "medium",
      category: "Billing",
      submitterName: "James Wilson",
      submitterEmail: "james.wilson@example.com",
    },
    {
      title: "App crashes when exporting to PDF",
      description: "Whenever I try to export a report to PDF using the export button, the app freezes for about 30 seconds and then crashes entirely. This happens on both Chrome and Firefox.",
      status: "open",
      priority: "high",
      category: "Bug Report",
      submitterName: "Emma Thompson",
      submitterEmail: "emma.t@company.org",
    },
    {
      title: "How do I set up two-factor authentication?",
      description: "I want to enable 2FA on my account for extra security. I looked through the settings but cannot find where to turn it on.",
      status: "resolved",
      priority: "low",
      category: "Account Settings",
      submitterName: "David Lee",
      submitterEmail: "david.lee@personal.net",
      assigneeId: 1,
      assigneeName: "Alex Chen",
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    {
      title: "Bulk import feature not working",
      description: "I am trying to import 500+ contacts from a CSV file using the bulk import feature. The upload finishes but no contacts appear in my list. The file format matches the template exactly.",
      status: "open",
      priority: "high",
      category: "Data Import",
      submitterName: "Rachel Kim",
      submitterEmail: "r.kim@startup.io",
    },
    {
      title: "Request for dark mode",
      description: "Would love to have a dark mode option. Spending long hours on the platform and the bright white background is straining my eyes. Many modern apps support this.",
      status: "closed",
      priority: "low",
      category: "Feature Request",
      submitterName: "Tom Baker",
      submitterEmail: "tombaker@freelance.com",
      assigneeId: 2,
      assigneeName: "Priya Sharma",
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 120),
    },
    {
      title: "Email notifications not being sent",
      description: "I should be receiving email notifications when tickets are updated, but I have not received any for the past week. My email is confirmed and notifications are enabled in settings.",
      status: "in_progress",
      priority: "medium",
      category: "Notifications",
      submitterName: "Lisa Chen",
      submitterEmail: "lisa.c@bigcorp.com",
      assigneeId: 2,
      assigneeName: "Priya Sharma",
    },
    {
      title: "Payment failed but was charged",
      description: "My payment failed with an error message but I can see a charge on my credit card. Please help me resolve this urgently as I cannot access premium features.",
      status: "open",
      priority: "urgent",
      category: "Billing",
      submitterName: "Mark Johnson",
      submitterEmail: "mark.j@enterprise.net",
    },
  ]).returning();

  console.log(`Inserted ${tickets.length} tickets`);

  console.log("Seeding comments...");
  const comments = await db.insert(commentsTable).values([
    {
      ticketId: tickets[0].id,
      authorName: "Alex Chen",
      authorEmail: "alex.chen@supportdesk.com",
      content: "Hi Sarah, I can see you're having trouble logging in. I've reset your account authentication tokens. Could you please try logging in again and let me know if the issue persists?",
      isInternal: false,
    },
    {
      ticketId: tickets[0].id,
      authorName: "Sarah Mitchell",
      authorEmail: "sarah.mitchell@example.com",
      content: "Thank you Alex! I just tried and I'm still getting the same error. It says \"Session expired, please try again.\"",
      isInternal: false,
    },
    {
      ticketId: tickets[0].id,
      authorName: "Alex Chen",
      authorEmail: "alex.chen@supportdesk.com",
      content: "Checking server logs — looks like there may be a session cookie conflict. Escalating to the auth team for a deeper look.",
      isInternal: true,
    },
    {
      ticketId: tickets[3].id,
      authorName: "Alex Chen",
      authorEmail: "alex.chen@supportdesk.com",
      content: "Hi David! To enable 2FA, go to Account Settings > Security > Two-Factor Authentication, then follow the prompts to link your authenticator app.",
      isInternal: false,
    },
    {
      ticketId: tickets[3].id,
      authorName: "David Lee",
      authorEmail: "david.lee@personal.net",
      content: "Found it! All set up now. Thanks so much for the quick response.",
      isInternal: false,
    },
    {
      ticketId: tickets[6].id,
      authorName: "Priya Sharma",
      authorEmail: "priya.sharma@supportdesk.com",
      content: "Hi Lisa, I can see your notification settings look correct on our end. Can you check your spam folder? We're also investigating a potential email delivery issue affecting some accounts.",
      isInternal: false,
    },
  ]).returning();

  console.log(`Inserted ${comments.length} comments`);

  console.log("Seeding KB articles...");
  const articles = await db.insert(kbArticlesTable).values([
    {
      title: "How to reset your password",
      content: `## Resetting Your Password\n\nIf you've forgotten your password or need to reset it for security reasons, follow these steps:\n\n### Steps\n\n1. Go to the login page and click **"Forgot Password"**\n2. Enter your registered email address\n3. Check your inbox for a password reset email (check spam if not found)\n4. Click the reset link within 15 minutes\n5. Enter and confirm your new password\n\n### Tips\n\n- Use a strong password with at least 8 characters\n- Include uppercase, lowercase, numbers, and symbols\n- Don't reuse passwords from other services\n\n### Still having issues?\n\nIf you don't receive the email within 5 minutes, contact support with your account email address.`,
      category: "Authentication",
      tags: ["password", "login", "security", "account"],
      published: true,
      viewCount: 142,
    },
    {
      title: "Setting up two-factor authentication",
      content: `## Two-Factor Authentication (2FA)\n\nAdding 2FA to your account significantly improves security by requiring a second verification step at login.\n\n### Supported Methods\n\n- **Authenticator App** (recommended): Google Authenticator, Authy, 1Password\n- **SMS**: Text message to your phone number\n\n### Setup Steps\n\n1. Go to **Account Settings > Security**\n2. Click **Enable Two-Factor Authentication**\n3. Choose your preferred method\n4. Follow the on-screen instructions\n5. Save your backup codes in a safe place\n\n### Backup Codes\n\nAlways save your backup codes when setting up 2FA. These are one-time codes you can use if you lose access to your authenticator app.\n\n> **Important:** Store backup codes somewhere safe and offline.`,
      category: "Security",
      tags: ["2fa", "security", "authentication", "account"],
      published: true,
      viewCount: 98,
    },
    {
      title: "Troubleshooting connection issues",
      content: `## Troubleshooting Connection Issues\n\nIf you're experiencing connectivity problems, follow this guide to diagnose and resolve the issue.\n\n### Quick Checks\n\n1. **Check your internet connection** — Try loading another website\n2. **Clear browser cache** — Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)\n3. **Try a different browser** — Test in Chrome, Firefox, or Edge\n4. **Disable extensions** — Browser extensions can sometimes interfere\n\n### Common Issues\n\n| Symptom | Likely Cause | Solution |\n|---------|-------------|----------|\n| Page won't load | DNS issue | Try a different network |\n| Slow loading | Network congestion | Check connection speed |\n| Login loops | Cookie issue | Clear cookies and retry |\n\n### Advanced Steps\n\nIf basic steps don't work:\n- Try using an incognito/private window\n- Check if a VPN or firewall is blocking access\n- Contact your IT department if on a corporate network`,
      category: "Network",
      tags: ["connection", "troubleshooting", "network", "browser"],
      published: true,
      viewCount: 211,
    },
    {
      title: "How to export data and reports",
      content: `## Exporting Data and Reports\n\nYou can export your data in several formats for use in other applications.\n\n### Supported Export Formats\n\n- **CSV** — Compatible with Excel and Google Sheets\n- **PDF** — For sharing and printing\n- **JSON** — For developers and API integrations\n\n### How to Export\n\n1. Navigate to the section you want to export (Reports, Contacts, etc.)\n2. Click the **Export** button in the top-right\n3. Select your desired format\n4. Choose a date range if applicable\n5. Click **Download**\n\n### Troubleshooting Export Issues\n\nIf your export fails:\n- Ensure you have the required permissions\n- Try exporting a smaller date range\n- Check that pop-ups are allowed in your browser\n- For PDF exports, ensure you have a stable connection\n\n### Large Exports\n\nExports over 10,000 rows are processed in the background. You'll receive an email with a download link when ready.`,
      category: "Data Management",
      tags: ["export", "csv", "pdf", "reports", "data"],
      published: true,
      viewCount: 76,
    },
  ]).returning();

  console.log(`Inserted ${articles.length} KB articles`);

  console.log("Seeding activity log...");
  const activity = await db.insert(activityLogTable).values([
    { type: "ticket_created", description: "New ticket submitted: \"Cannot log into my account\"", ticketId: tickets[0].id, ticketTitle: tickets[0].title },
    { type: "ticket_created", description: "New ticket submitted: \"Invoice shows wrong billing address\"", ticketId: tickets[1].id, ticketTitle: tickets[1].title },
    { type: "ticket_created", description: "New ticket submitted: \"App crashes when exporting to PDF\"", ticketId: tickets[2].id, ticketTitle: tickets[2].title },
    { type: "ticket_resolved", description: "Ticket status changed to resolved: \"How do I set up two-factor authentication?\"", ticketId: tickets[3].id, ticketTitle: tickets[3].title },
    { type: "comment_added", description: "New comment added to: \"Cannot log into my account\"", ticketId: tickets[0].id, ticketTitle: tickets[0].title },
    { type: "ticket_created", description: "New ticket submitted: \"Bulk import feature not working\"", ticketId: tickets[4].id, ticketTitle: tickets[4].title },
    { type: "ticket_closed", description: "Ticket closed: \"Request for dark mode\"", ticketId: tickets[5].id, ticketTitle: tickets[5].title },
    { type: "ticket_updated", description: "Ticket assigned to Priya Sharma: \"Email notifications not being sent\"", ticketId: tickets[6].id, ticketTitle: tickets[6].title },
    { type: "ticket_created", description: "New ticket submitted: \"Payment failed but was charged\"", ticketId: tickets[7].id, ticketTitle: tickets[7].title },
    { type: "comment_added", description: "Internal note added to: \"Cannot log into my account\"", ticketId: tickets[0].id, ticketTitle: tickets[0].title },
  ]).returning();

  console.log(`Inserted ${activity.length} activity log entries`);
  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
