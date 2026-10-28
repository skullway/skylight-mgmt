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
  const [pending, upcoming, openSlots] = await Promise.all([
    db.appointment.count({ where: { status: "PENDING" } }),
    db.appointment.count({ where: { status: "CONFIRMED", slot: { startsAt: { gte: now } } } }),
    db.availabilitySlot.count({ where: { status: "OPEN", startsAt: { gte: now } } }),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat label="בקשות ממתינות" value={pending} />
      <Stat label="פגישות קרובות" value={upcoming} />
      <Stat label="משבצות פנויות" value={openSlots} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-3xl font-semibold">{value}</div>
    </div>
  );
}
