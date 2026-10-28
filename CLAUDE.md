# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

**Next.js 16.4 with React 19.3.** APIs differ from older Next.js. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. `next.config.ts` turns on `cacheComponents` and `partialPrefetching`: anything that reads the session or request must sit inside `<Suspense>` (see `docs/01-app/02-guides/authentication-with-cache-components.md`). Middleware is now `proxy.ts`. Tailwind v4 runs through a Turbopack CSS loader instead of PostCSS.

## Commands

```bash
npm run dev            # next dev
npm run build          # prisma generate && next build
npm run lint           # eslint (flat config, eslint-config-next)
npx prisma generate    # regenerate client into src/generated/prisma
npm run db:migrate     # prisma migrate dev (uses DIRECT_URL)
npm run db:deploy      # prisma migrate deploy; never run from the Vercel build
```

There is no test framework yet.

## What the app does

The app schedules therapy sessions for a single therapist who works at several clinics. The UI is Hebrew, right-to-left (`lang="he" dir="rtl"`, Heebo font), and every time is in the `Asia/Jerusalem` time zone (`CLINIC_TZ` in `src/lib/clinics/deepLink.ts`).

- Customers book as **guests** with a name and an E.164 phone number. Each appointment has a `manageToken` that powers a private manage/cancel link.
- The therapist (admin) signs in with Google through next-auth v4, limited to the `ADMIN_EMAILS` allowlist. Until that's built, `isAdmin()` in `src/lib/auth.ts` returns false, which locks every admin route.
- **Preventing double booking:** a booking flips the slot from `OPEN` to `HELD` with a conditional `updateMany` inside a transaction. If no row changes, the slot is taken (409). Denying or cancelling an appointment must set the slot back to `OPEN`. `Appointment.slotId` is intentionally not unique, so appointment history is kept.
- **Room reservation:** `getProvider(clinic)` in `src/lib/clinics/` returns a `ClinicProvider` based on `Clinic.integration`. `DEEP_LINK` fills `bookingUrlTemplate` (`{date}`, `{start}`, `{end}`) and the therapist finishes the booking on the clinic's site. `WEB_LOGIN` is a placeholder until the clinic sites are researched. Room state is tracked separately in `Appointment.roomStatus`.
- **WhatsApp:** `src/lib/whatsapp.ts` sends approved Meta Cloud API templates in Hebrew. A failed send must never fail the main action. The plan is to log every send in `MessageLog`.
- **Reminders:** a Vercel cron runs once a day (the Hobby plan doesn't allow anything more frequent) and messages customers with a `CONFIRMED` appointment tomorrow, Israel time. It's protected by `Bearer $CRON_SECRET`.

## Prisma 7 specifics

- The generator is `prisma-client` and outputs to `src/generated/prisma`, which is gitignored and regenerated during the build. Import from `@/generated/prisma/client`, never from `@prisma/client`.
- The datasource URL isn't in `schema.prisma`. `prisma.config.ts` reads `DIRECT_URL`, the non-pooled URL the CLI needs, and throws if it isn't set. At runtime, `src/lib/db.ts` connects with `DATABASE_URL` (Neon pooled) through `@prisma/adapter-pg`.
