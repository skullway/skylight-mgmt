import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { dayKey, timeKey } from "@/lib/time";
import { BookingFlow } from "./BookingFlow";

export const metadata: Metadata = { title: "קביעת פגישה · Skylight" };

const BOOKING_WINDOW_DAYS = 60;

export default function BookPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">קביעת פגישה</h1>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          חזרה לדף הבית
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">טוען מועדים פנויים…</p>}>
        <AvailableSlots />
      </Suspense>
    </main>
  );
}

async function AvailableSlots() {
  await connection(); // always fresh: availability changes with every booking
  const now = new Date();
  const until = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 864e5);

  const [clinics, slots] = await Promise.all([
    db.clinic.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, address: true },
    }),
    db.availabilitySlot.findMany({
      where: { status: "OPEN", startsAt: { gt: now, lt: until }, clinic: { active: true } },
      orderBy: { startsAt: "asc" },
      select: { id: true, clinicId: true, startsAt: true, endsAt: true },
    }),
  ]);

  return (
    <BookingFlow
      clinics={clinics}
      slots={slots.map((s) => ({
        id: s.id,
        clinicId: s.clinicId,
        day: dayKey(s.startsAt),
        start: timeKey(s.startsAt),
        end: timeKey(s.endsAt),
      }))}
    />
  );
}
