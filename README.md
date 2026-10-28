# Skylight Management

Therapy session scheduling. Customers request a slot at one of the therapist's clinics, the therapist accepts or denies it and reserves a room at the clinic, and customers get WhatsApp updates and reminders.

Stack: Next.js 16, Prisma 7, Neon Postgres, Vercel.

## Setup

```bash
npm install
cp .env.example .env    # fill in values
npx prisma generate
npm run db:deploy       # apply migrations to the database in DIRECT_URL
npm run db:seed         # optional: fake clinics, slots and appointments (wipes existing data!)
npm run dev
```

- Customer booking: http://localhost:3000/book
- Admin: http://localhost:3000/admin. Set `DEV_LOGIN=true` in `.env` to sign in without Google while developing.

## Admin sign-in with Google

1. In Google Cloud Console, go to APIs & Services → Credentials and create an OAuth client ID of type "Web application".
2. Add the authorized redirect URIs `http://localhost:3000/api/auth/callback/google` and `https://<your-domain>/api/auth/callback/google`.
3. Put the client ID and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. List the allowed email addresses, comma-separated, in `ADMIN_EMAILS`.

## WhatsApp

By default (`WHATSAPP_MODE=fake`) messages aren't sent. They're printed to the server console and listed on `/admin/messages`. To send for real through Meta's WhatsApp Cloud API:

1. Get the four templates in `src/lib/messages.ts` approved in WhatsApp Manager, in Hebrew (`he`). Use the same names, with `{{1}}`, `{{2}}`… as the variables.
2. Set `WHATSAPP_MODE=meta`, `WHATSAPP_PHONE_ID` and `WHATSAPP_TOKEN`. Use a long-lived system-user token.

## Database

- `npm run db:migrate -- --name <change>`: create and apply a migration in development.
- `npm run db:deploy`: apply committed migrations. Run this against production yourself; the Vercel build does not run migrations.
- `npm run db:seed`: reset the development database to fake data. It refuses to run with `NODE_ENV=production`.

## Deploying to Vercel

Set the variables from `.env.example` in the Vercel project, including `DIRECT_URL`, which `prisma generate` needs during the build. Leave `DEV_LOGIN` unset. The reminder cron in `vercel.json` runs once a day at 15:00 UTC, the most often Vercel's Hobby plan allows. It sends reminders for the next day's confirmed appointments and retries failed messages.
