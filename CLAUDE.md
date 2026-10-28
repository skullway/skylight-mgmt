# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

**Next.js 16.4 with React 19.3.** APIs differ from older Next.js. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. `next.config.ts` turns on `cacheComponents` and `partialPrefetching`. Middleware is now `src/proxy.ts`. Tailwind v4 runs through a Turbopack CSS loader instead of PostCSS.

## Commands

```bash
npm run dev            # next dev
npm run build          # prisma generate && next build
npm run lint           # eslint (flat config, eslint-config-next)
npx tsc --noEmit       # typecheck (run `npx next typegen` first after adding/removing routes)
npx prisma generate    # regenerate client into src/generated/prisma
npm run db:migrate     # prisma migrate dev (uses DIRECT_URL)
npm run db:deploy      # prisma migrate deploy; never run from the Vercel build
npm run db:seed        # WIPES all app tables, then loads fake clinics/slots/appointments
```

There is no test framework yet.

## What the app does

The app schedules therapy sessions for one therapist who works at several clinics. The UI is Hebrew, right-to-left. Hebrew imperatives are gendered, so UI copy uses nouns and infinitives ("בחירת תאריך", not "בחר/י"). Every time is in `Asia/Jerusalem`: use the helpers in `src/lib/time.ts` (`zonedToUtc`, `dayKey`, `formatDateTime`…) and never format dates by hand.

- **Customers (public):**
  - `/book` is a client-side flow: clinic → calendar → time → name/phone.
  - Submitting calls a Server Action, which redirects to `/b/[token]`.
  - The guest manages or cancels the booking there. The random `manageToken` is their only credential, so that page is `noindex` and `no-referrer`.
- **Therapist (`/admin/*`):**
  - Pages: requests inbox (accept/deny), upcoming appointments with room status, availability (individual slots), clinics, and a message log.
  - Admin login is next-auth v4 with Google, limited to `ADMIN_EMAILS`.
  - Setting `DEV_LOGIN=true` adds a local-only login. It's never active in production builds.

## Architecture

- **Domain logic lives in `src/lib`.** Server Actions in `src/app/**/actions.ts` stay thin: check auth, validate with zod, call a `src/lib` function, `refresh()` or `redirect()`. There are no JSON API routes except next-auth and the cron.
- **Appointment lifecycle (`src/lib/appointments.ts`).**
  - Booking flips the slot from `OPEN` to `HELD` with a conditional `updateMany` in a transaction. If no row changes, someone else got the slot.
  - Deny and cancel free the slot again.
  - Every status transition is a conditional update, so a double click or a stale page is a no-op.
  - `Appointment.slotId` is intentionally not unique, to keep history.
- **Authorization.**
  - Every admin page's data component calls `requireAdminPage()`. Every admin Server Action calls `requireAdmin()`.
  - `proxy.ts` only redirects anonymous visitors.
  - `getAdminSession()` reads the JWT from the `Cookie` header via `getToken`. Don't switch it to `getServerSession()`: its `cookies()` call throws an InvariantError in Next 16 dev when a page re-renders after a Server Action.
- **Cache Components page pattern.** Each page component is a static shell. Anything that reads the session, `params`, `searchParams`, the database, or `new Date()` goes in a child component wrapped in `<Suspense>`. Otherwise dev shows "blocking route" errors on client navigations.
- **Rooms (`src/lib/clinics/`).**
  - `getProvider(clinic)` picks the strategy from `Clinic.integration`.
  - `DEEP_LINK` fills `{date}`/`{start}`/`{end}` in `bookingUrlTemplate`. The therapist books on the clinic site, then marks the room reserved.
  - `WEB_LOGIN` is a placeholder until the clinic sites are researched.
- **WhatsApp.**
  - `notify(kind, appt)` in `src/lib/notify.ts` sends a template and logs the attempt in `MessageLog`. It never throws.
  - Server Actions call it inside `after()`.
  - Message texts and template names are in `src/lib/messages.ts`.
  - `WHATSAPP_MODE` defaults to `fake`, which logs to the console and `/admin/messages`. `meta` sends for real.
  - `runDailyMessages()` in `src/lib/reminders.ts` sends tomorrow's reminders and retries recent failures. It runs from the daily Vercel cron (`/api/cron/reminders`, `Bearer $CRON_SECRET`) and from a button on `/admin/messages`.

## Prisma 7 specifics

- The generator is `prisma-client` and outputs to `src/generated/prisma`, which is gitignored and regenerated during the build. Import from `@/generated/prisma/client`, never from `@prisma/client`.
- The datasource URL isn't in `schema.prisma`. `prisma.config.ts` reads `DIRECT_URL` (non-pooled, for the CLI) and throws if it isn't set. At runtime, `src/lib/db.ts` connects with `DATABASE_URL` (Neon pooled) through `@prisma/adapter-pg`.
- To run a script that imports `src/lib` files marked `server-only`, use `npx tsx --conditions=react-server`.
