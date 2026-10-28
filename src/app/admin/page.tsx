import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">לוח בקרה</h1>
      <Suspense fallback={<p className="text-zinc-500">טוען…</p>}>
        <Stats />
      </Suspense>
    </div>
  );
}

async function Stats() {
  await requireAdminPage();
  const now = new Date();
  const upcoming = { status: "CONFIRMED", slot: { startsAt: { gte: now } } } as const;
  const [pending, confirmed, roomsToReserve, openSlots] = await Promise.all([
    db.appointment.count({ where: { status: "PENDING", slot: { startsAt: { gt: now } } } }),
    db.appointment.count({ where: upcoming }),
    db.appointment.count({ where: { ...upcoming, roomStatus: { not: "RESERVED" } } }),
    db.availabilitySlot.count({ where: { status: "OPEN", startsAt: { gte: now } } }),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat href="/admin/requests" label="בקשות ממתינות" value={pending} highlight={pending > 0} />
      <Stat href="/admin/appointments" label="חדרים שצריך להזמין" value={roomsToReserve} highlight={roomsToReserve > 0} />
      <Stat href="/admin/appointments" label="פגישות קרובות" value={confirmed} />
      <Stat href="/admin/availability" label="משבצות פנויות" value={openSlots} />
    </div>
  );
}

function Stat({ href, label, value, highlight }: { href: string; label: string; value: number; highlight?: boolean }) {
  return (
    <Link href={href} className={`card hover:border-zinc-400 ${highlight ? "border-amber-300 dark:border-amber-800" : ""}`}>
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </Link>
  );
}
