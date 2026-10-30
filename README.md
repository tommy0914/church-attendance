# Church Attendance Management System

A mobile friendly church attendance application designed to help church teams manage member registration, attendance check ins, and attendance records from one place.

**Live application:** https://church-attendance-kappa-three.vercel.app/
**Source code:** https://github.com/tommy0914/church-attendance

## Overview

Church Attendance is a web application built with Next.js and Supabase. It includes dedicated routes for registration, login, attendance, dashboards, and administration. The project also includes QR code generation and scanning dependencies to support QR based attendance workflows, along with offline support utilities and Progressive Web App tooling.

The goal is to reduce manual attendance taking, make records easier to review, and give authorized church workers a practical interface for managing attendance.

Feature availability depends on the current implementation and Supabase configuration.

## Features

- **Member registration and login:** Registration and authentication screens for users.
- **Attendance check in:** Dedicated attendance workflow for recording attendance.
- **QR code support:** QR code generation and browser based QR scanning libraries are included.
- **Admin area:** Separate admin routes for authorized management workflows.
- **Dashboard:** A dedicated dashboard route for attendance related information.
- **Supabase integration:** Supabase client libraries for backend data and authentication services.
- **Offline support:** An offline utility module to support selected offline workflows.
- **Progressive Web App support:** PWA dependency included for installable web app capabilities.
- **Responsive interface:** Next.js and Tailwind CSS based application designed for browser use across screen sizes.

Some capabilities may require further configuration or validation before production use.

## Technology stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 |
| UI library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Backend services | Supabase |
| Authentication and data access | Supabase JavaScript client and SSR helpers |
| QR generation | qrcode |
| QR scanning | html5-qrcode |
| Charts | Recharts |
| Icons | Lucide React |
| PWA tooling | next-pwa |
| Hosting | Vercel |

## Application structure

```text
church-attendance/
├── app/
│   ├── admin/             # Administrative routes
│   ├── attend/            # Attendance check in workflows
│   ├── dashboard/         # Dashboard views
│   ├── forgot-password/   # Password recovery
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── reset-password/    # Password reset page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Application landing page
├── components/            # Reusable UI components
├── lib/
│   ├── offline.ts         # Offline support utilities
│   └── supabase/          # Supabase client setup
├── public/                # Static assets
├── middleware.ts          # Request and route handling
├── next.config.js         # Next.js configuration
├── package.json
└── README.md
```

Directory contents may change as the application evolves. Check the latest repository tree for the definitive structure.

## Requirements

- Node.js compatible with the installed Next.js version
- npm
- A Supabase project
- Git

## Run locally

### 1. Clone the repository

```bash
git clone https://github.com/tommy0914/church-attendance.git
cd church-attendance
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Supabase

Create a local environment file:

```bash
touch .env.local
```

Add the Supabase project values required by the application:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Use the exact environment variable names referenced in the files under `lib/supabase`. If the project uses a publishable key variable instead of the legacy anon key variable, configure the name expected by the source code.

Do not commit `.env.local` or any real credentials. Never expose a Supabase service role key in a variable prefixed with `NEXT_PUBLIC_`.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Build the production application |
| `npm run start` | Run the built application |
| `npm run lint` | Run ESLint checks |

## Supabase configuration

Supabase provides the backend services used by the application. Before deploying, verify the following:

1. The required database tables and relationships exist.
2. Authentication settings and redirect URLs match your local and production URLs.
3. Row Level Security (RLS) is enabled and policies restrict access to authorized users.
4. Admin privileges are enforced through trusted server side checks, not only by hiding UI elements.
5. Any storage buckets used for profile images or other uploads have appropriate access policies.

The exact schema and policies should be taken from the current application implementation and Supabase project configuration.

## Attendance workflow

A typical attendance session can follow this process:

1. An authorized worker opens the attendance page.
2. A member identifies themselves or uses the configured QR code workflow.
3. The application validates the member and records the check in.
4. Authorized workers review attendance information from the dashboard or admin area.

The actual validation rules, duplicate check in prevention, and session management should be confirmed against the current implementation.

## Deployment

The project is configured for deployment as a Next.js application and currently has a Vercel deployment URL.

Recommended deployment checklist:

1. Import the GitHub repository into Vercel.
2. Add the required Supabase environment variables in the Vercel project settings.
3. Configure the correct Supabase authentication site URL and redirect URLs.
4. Confirm production database policies and role permissions.
5. Test registration, login, password reset, QR scanning, attendance recording, and dashboard access on a mobile device.
6. Verify the production build and review application logs before launch.

## Security and privacy

Attendance systems handle personal information. Apply the following safeguards:

- Collect only the member information needed for church administration.
- Restrict member records and attendance history to authorized roles.
- Use Supabase Row Level Security policies for database access.
- Validate attendance submissions on the server or through trusted database policies.
- Prevent duplicate attendance records for the same member and session where required.
- Keep secrets out of source control and public client side variables.
- Provide a clear process for correcting inaccurate attendance records.
- Protect profile photos and contact information from unauthorized access.

## Contributing

1. Create a feature branch.
2. Make a focused change and update relevant documentation.
3. Run `npm run lint` and `npm run build`.
4. Test affected authentication and attendance workflows.
5. Open a pull request describing the change.

## License

No license is currently specified in the repository. Contact the repository owner for permission before redistributing or using this project outside its intended scope.
