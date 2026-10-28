# Skylight Management

Therapy session scheduling. Customers request a slot at one of the therapist's clinics, the therapist accepts or denies it and reserves a room at the clinic, and customers get WhatsApp updates and reminders.

Stack: Next.js 16, Prisma 7, Neon Postgres, Vercel.

## Setup

```bash
npm install
cp .env.example .env    # fill in values
npx prisma generate
npm run db:deploy       # apply migrations to the database in DIRECT_URL
npm run dev
```

## Database

- `npm run db:migrate -- --name <change>`: create and apply a migration in development.
- `npm run db:deploy`: apply committed migrations. Run this against production yourself; the Vercel build does not run migrations.

## Deploying to Vercel

Set every variable from `.env.example` in the Vercel project, including `DIRECT_URL`, which `prisma generate` needs during the build. The reminder cron in `vercel.json` runs once a day at 15:00 UTC, the most often Vercel's Hobby plan allows.
