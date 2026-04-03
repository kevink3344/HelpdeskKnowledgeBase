import pg from "pg";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

console.log("Clearing existing data...");
await client.query("DELETE FROM activity_log");
await client.query("DELETE FROM attachments");
await client.query("DELETE FROM comments");
await client.query("DELETE FROM kb_articles");
await client.query("DELETE FROM tickets");

console.log("Seeding tickets...");
const ticketRows = await client.query(`
  INSERT INTO tickets (title, description, status, priority, category, submitter_name, submitter_email, assignee_id, assignee_name, resolved_at)
  VALUES
    ('Cannot log into my account', 'I have been trying to log in for the past 2 hours but keep getting an "invalid credentials" error even though I am sure my password is correct. I tried resetting it twice already.', 'in_progress', 'urgent', 'Authentication', 'Sarah Mitchell', 'sarah.mitchell@example.com', 1, 'Alex Chen', NULL),
    ('Invoice shows wrong billing address', 'The invoice I received last month has my old address on it. I updated my address in account settings 3 months ago but it still shows the old one on invoices.', 'open', 'medium', 'Billing', 'James Wilson', 'james.wilson@example.com', NULL, NULL, NULL),
    ('App crashes when exporting to PDF', 'Whenever I try to export a report to PDF using the export button, the app freezes for about 30 seconds and then crashes entirely. This happens on both Chrome and Firefox.', 'open', 'high', 'Bug Report', 'Emma Thompson', 'emma.t@company.org', NULL, NULL, NULL),
    ('How do I set up two-factor authentication?', 'I want to enable 2FA on my account for extra security. I looked through the settings but cannot find where to turn it on.', 'resolved', 'low', 'Account Settings', 'David Lee', 'david.lee@personal.net', 1, 'Alex Chen', NOW() - INTERVAL '48 hours'),
    ('Bulk import feature not working', 'I am trying to import 500+ contacts from a CSV file using the bulk import feature. The upload finishes but no contacts appear in my list. The file format matches the template exactly.', 'open', 'high', 'Data Import', 'Rachel Kim', 'r.kim@startup.io', NULL, NULL, NULL),
    ('Request for dark mode', 'Would love to have a dark mode option. Spending long hours on the platform and the bright white background is straining my eyes. Many modern apps support this.', 'closed', 'low', 'Feature Request', 'Tom Baker', 'tombaker@freelance.com', 2, 'Priya Sharma', NOW() - INTERVAL '120 hours'),
    ('Email notifications not being sent', 'I should be receiving email notifications when tickets are updated, but I have not received any for the past week. My email is confirmed and notifications are enabled in settings.', 'in_progress', 'medium', 'Notifications', 'Lisa Chen', 'lisa.c@bigcorp.com', 2, 'Priya Sharma', NULL),
    ('Payment failed but was charged', 'My payment failed with an error message but I can see a charge on my credit card. Please help me resolve this urgently as I cannot access premium features.', 'open', 'urgent', 'Billing', 'Mark Johnson', 'mark.j@enterprise.net', NULL, NULL, NULL)
  RETURNING id
`);

const ids = ticketRows.rows.map(r => r.id);
console.log(`Inserted ${ids.length} tickets with IDs: ${ids.join(", ")}`);

console.log("Seeding comments...");
const commentData = [
  [ids[0], 'Alex Chen', 'alex.chen@supportdesk.com', "Hi Sarah, I can see you're having trouble logging in. I've reset your account authentication tokens. Could you please try logging in again and let me know if the issue persists?", false],
  [ids[0], 'Sarah Mitchell', 'sarah.mitchell@example.com', 'Thank you Alex! I just tried and I\'m still getting the same error. It says "Session expired, please try again."', false],
  [ids[0], 'Alex Chen', 'alex.chen@supportdesk.com', 'Checking server logs — looks like there may be a session cookie conflict. Escalating to the auth team for a deeper look.', true],
  [ids[3], 'Alex Chen', 'alex.chen@supportdesk.com', 'Hi David! To enable 2FA, go to Account Settings > Security > Two-Factor Authentication, then follow the prompts to link your authenticator app.', false],
  [ids[3], 'David Lee', 'david.lee@personal.net', 'Found it! All set up now. Thanks so much for the quick response.', false],
  [ids[6], 'Priya Sharma', 'priya.sharma@supportdesk.com', "Hi Lisa, I can see your notification settings look correct on our end. Can you check your spam folder? We're also investigating a potential email delivery issue affecting some accounts.", false],
];
for (const [ticketId, authorName, authorEmail, content, isInternal] of commentData) {
  await client.query(
    `INSERT INTO comments (ticket_id, author_name, author_email, content, is_internal) VALUES ($1, $2, $3, $4, $5)`,
    [ticketId, authorName, authorEmail, content, isInternal]
  );
}
console.log("Inserted 6 comments");

console.log("Seeding KB articles...");
await client.query(`
  INSERT INTO kb_articles (title, content, category, tags, published, view_count)
  VALUES
    (
      'How to reset your password',
      E'## Resetting Your Password\n\nIf you''ve forgotten your password or need to reset it for security reasons, follow these steps:\n\n### Steps\n\n1. Go to the login page and click **"Forgot Password"**\n2. Enter your registered email address\n3. Check your inbox for a password reset email (check spam if not found)\n4. Click the reset link within 15 minutes\n5. Enter and confirm your new password\n\n### Tips\n\n- Use a strong password with at least 8 characters\n- Include uppercase, lowercase, numbers, and symbols\n- Don''t reuse passwords from other services\n\n### Still having issues?\n\nIf you don''t receive the email within 5 minutes, contact support with your account email address.',
      'Authentication',
      ARRAY['password', 'login', 'security', 'account'],
      true,
      142
    ),
    (
      'Setting up two-factor authentication',
      E'## Two-Factor Authentication (2FA)\n\nAdding 2FA to your account significantly improves security by requiring a second verification step at login.\n\n### Supported Methods\n\n- **Authenticator App** (recommended): Google Authenticator, Authy, 1Password\n- **SMS**: Text message to your phone number\n\n### Setup Steps\n\n1. Go to **Account Settings > Security**\n2. Click **Enable Two-Factor Authentication**\n3. Choose your preferred method\n4. Follow the on-screen instructions\n5. Save your backup codes in a safe place\n\n### Backup Codes\n\nAlways save your backup codes when setting up 2FA. These are one-time codes you can use if you lose access to your authenticator app.\n\n> **Important:** Store backup codes somewhere safe and offline.',
      'Security',
      ARRAY['2fa', 'security', 'authentication', 'account'],
      true,
      98
    ),
    (
      'Troubleshooting connection issues',
      E'## Troubleshooting Connection Issues\n\nIf you''re experiencing connectivity problems, follow this guide to diagnose and resolve the issue.\n\n### Quick Checks\n\n1. **Check your internet connection** — Try loading another website\n2. **Clear browser cache** — Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)\n3. **Try a different browser** — Test in Chrome, Firefox, or Edge\n4. **Disable extensions** — Browser extensions can sometimes interfere\n\n### Common Issues\n\n| Symptom | Likely Cause | Solution |\n|---------|-------------|----------|\n| Page won''t load | DNS issue | Try a different network |\n| Slow loading | Network congestion | Check connection speed |\n| Login loops | Cookie issue | Clear cookies and retry |\n\n### Advanced Steps\n\nIf basic steps don''t work:\n- Try using an incognito/private window\n- Check if a VPN or firewall is blocking access\n- Contact your IT department if on a corporate network',
      'Network',
      ARRAY['connection', 'troubleshooting', 'network', 'browser'],
      true,
      211
    ),
    (
      'How to export data and reports',
      E'## Exporting Data and Reports\n\nYou can export your data in several formats for use in other applications.\n\n### Supported Export Formats\n\n- **CSV** — Compatible with Excel and Google Sheets\n- **PDF** — For sharing and printing\n- **JSON** — For developers and API integrations\n\n### How to Export\n\n1. Navigate to the section you want to export (Reports, Contacts, etc.)\n2. Click the **Export** button in the top-right\n3. Select your desired format\n4. Choose a date range if applicable\n5. Click **Download**\n\n### Troubleshooting Export Issues\n\nIf your export fails:\n- Ensure you have the required permissions\n- Try exporting a smaller date range\n- Check that pop-ups are allowed in your browser\n- For PDF exports, ensure you have a stable connection\n\n### Large Exports\n\nExports over 10,000 rows are processed in the background. You''ll receive an email with a download link when ready.',
      'Data Management',
      ARRAY['export', 'csv', 'pdf', 'reports', 'data'],
      true,
      76
    )
`);

console.log("Inserted 4 KB articles");

console.log("Seeding activity log...");
await client.query(`
  INSERT INTO activity_log (type, description, ticket_id, ticket_title)
  VALUES
    ('ticket_created', 'New ticket submitted: "Cannot log into my account"', $1, 'Cannot log into my account'),
    ('ticket_created', 'New ticket submitted: "Invoice shows wrong billing address"', $2, 'Invoice shows wrong billing address'),
    ('ticket_created', 'New ticket submitted: "App crashes when exporting to PDF"', $3, 'App crashes when exporting to PDF'),
    ('ticket_resolved', 'Ticket status changed to resolved: "How do I set up two-factor authentication?"', $4, 'How do I set up two-factor authentication?'),
    ('comment_added', 'New comment added to: "Cannot log into my account"', $1, 'Cannot log into my account'),
    ('ticket_created', 'New ticket submitted: "Bulk import feature not working"', $5, 'Bulk import feature not working'),
    ('ticket_closed', 'Ticket closed: "Request for dark mode"', $6, 'Request for dark mode'),
    ('ticket_updated', 'Ticket assigned to Priya Sharma: "Email notifications not being sent"', $7, 'Email notifications not being sent'),
    ('ticket_created', 'New ticket submitted: "Payment failed but was charged"', $8, 'Payment failed but was charged'),
    ('comment_added', 'Internal note added to: "Cannot log into my account"', $1, 'Cannot log into my account')
`, [ids[0], ids[1], ids[2], ids[3], ids[4], ids[5], ids[6], ids[7]]);

console.log("Inserted 10 activity log entries");

await client.end();
console.log("Seed complete!");
