# Church Attendance Management System

A mobile friendly church attendance application designed to help church teams manage member registration, attendance check ins, student information and attendance records.

**Live application:** https://church-attendance-kappa-three.vercel.app/
**Source code:** https://github.com/tommy0914/church-attendance

## Technology

Next.js 16, React 19, TypeScript, Tailwind CSS 4 and Supabase Auth/Database/Storage. Hosted on Vercel.

## Features

- Member registration and authentication
- QR attendance check in and service management
- Admin dashboard, member directory and attendance analytics
- Public student information registration for Faith Baptist Church Ogbomoso
- Authorized student records dashboard
- Optional Google Sheets and Drive synchronization
- Offline utilities and PWA support

## Student Information System

The student registration workflow is available at `/student-registration`. Authorized church administrators and department leaders can access records at `/student-records`. The records API checks the authenticated Supabase user and the configured student registration access role. Department leaders are restricted to their assigned department.

### Database setup

Run `supabase/migrations/202611040001_student_registrations.sql` in the Supabase SQL editor. The migration creates the student records and access tables plus row-level security policies.

### Server environment variables

Configure these in Vercel and local `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never expose with NEXT_PUBLIC)
- `FBCO_APPS_SCRIPT_URL` (optional until Google Sheets sync is deployed)
- `FBCO_SYNC_SECRET` (server only, same value as Apps Script property)

### Google Sheets setup

Follow `integrations/google-apps-script/README.md`. The church's regular Gmail account owns the spreadsheet and private Drive folder. The Next.js server saves each registration in Supabase first, then synchronizes to Google Sheets. A temporary Google outage does not discard the registration; its sync status remains pending.

### Assigning student access

After the staff member has an authenticated account in Supabase, a church administrator can grant access by inserting a row into `student_registration_access`:

```sql
insert into public.student_registration_access (user_id, role, department)
values ('AUTH_USER_UUID', 'department_leader', 'Computer Science');
```

For a church administrator, use role `church_admin` and leave department null. Only authorized administrators should perform access assignments.

## Local development

```bash
npm install
npm run dev
```

Do not commit environment files, service role keys, Apps Script URLs containing credentials, or synchronization secrets.
