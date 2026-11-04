# Google Sheets integration

1. Sign in with the church's regular Gmail account and create a standalone Apps Script project at https://script.google.com.
2. Paste the contents of Code.gs into the editor.
3. In Project Settings, add Script Properties:
   * FBCO_SYNC_SECRET: a long random secret.
   * FBCO_NOTIFICATION_EMAIL: the church inbox for registration notifications.
4. Run setupFbcoStudentSheet once and authorize Google Sheets, Drive and Gmail.
5. Deploy as a Web App, executing as the church account. Configure access so the Next.js server can reach the endpoint.
6. Copy the deployed URL ending in /exec.

Set these server-only Vercel variables:
* SUPABASE_SERVICE_ROLE_KEY
* FBCO_APPS_SCRIPT_URL
* FBCO_SYNC_SECRET

The FBCO_SYNC_SECRET value must match in Vercel and Apps Script. Never put secrets in NEXT_PUBLIC variables or commit them to Git.

The Next.js API writes each registration to Supabase first, then synchronizes it to Sheets. A Google sync failure leaves the Supabase record intact with a pending sync status. The spreadsheet and Drive photo folder must remain private and be shared only with approved church personnel.

This Apps Script endpoint uses a shared secret. Anyone with the deployment URL and secret could submit data, so rotate the secret if exposed and keep the URL/secret server-side.
