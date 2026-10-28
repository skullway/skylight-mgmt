import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { dayKey, dayRange, formatDay, isDayKey, shiftDay, timeKey, weekStart } from "@/lib/time";
import { AddSlotForm } from "./AddSlotForm";
import { closeSlot, deleteSlot, reopenSlot } from "./actions";

export default function AvailabilityPage({ searchParams }: PageProps<"/admin/availability">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">זמינות</h1>
      <Suspense fallback={<p className="text-zinc-500">טוען…</p>}>
        <Week searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const STATUS = {
  OPEN: { label: "פנויה", className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
  HELD: { label: "תפוסה", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  CLOSED: { label: "סגורה", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400" },
} as const;

async function Week({ searchParams }: { searchParams: PageProps<"/admin/availability">["searchParams"] }) {
  await requireAdminPage();
  const { week } = await searchParams;
  const today = dayKey(new Date());
  const start = weekStart(isDayKey(week) ? week : today);
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(start, i));

  const [clinics, slots] = await Promise.all([
    db.clinic.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.availabilitySlot.findMany({
      where: { startsAt: { gte: dayRange(start).from, lt: dayRange(shiftDay(start, 7)).from } },
      orderBy: { startsAt: "asc" },
      include: {
        clinic: { select: { name: true } },
        appointments: {
          where: { status: { in: ["PENDING", "CONFIRMED"] } },
          select: { customerName: true, status: true },
        },
        _count: { select: { appointments: true } },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <AddSlotForm clinics={clinics} defaultDay={start > today ? start : today} />

      <div className="flex items-center justify-between">
        <Link href={`/admin/availability?week=${shiftDay(start, -7)}`} className="btn-secondary">
          → שבוע קודם
        </Link>
        <span className="text-sm text-zinc-500">
          {formatDay(dayRange(start).from)} – {formatDay(dayRange(shiftDay(start, 6)).from)}
        </span>
        <Link href={`/admin/availability?week=${shiftDay(start, 7)}`} className="btn-secondary">
          שבוע הבא ←
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {days.map((day) => {
          const daySlots = slots.filter((s) => dayKey(s.startsAt) === day);
          return (
            <section key={day} className={day === today ? "card border-sky-400 dark:border-sky-700" : "card"}>
              <h2 className="mb-2 font-medium">{formatDay(dayRange(day).from)}</h2>
              {daySlots.length === 0 ? (
                <p className="text-sm text-zinc-500">אין משבצות</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {daySlots.map((s) => {
                    const appt = s.appointments[0];
                    const past = s.startsAt <= new Date();
                    return (
                      <li key={s.id} className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-mono" dir="ltr">
                          {timeKey(s.startsAt)}–{timeKey(s.endsAt)}
                        </span>
                        <span>{s.clinic.name}</span>
                        <span className={`rounded px-2 py-0.5 text-xs ${STATUS[s.status].className}`}>
                          {STATUS[s.status].label}
                        </span>
                        {appt && (
                          <span className="text-zinc-500">
                            {appt.customerName} ({appt.status === "PENDING" ? "ממתין לאישור" : "מאושר"})
                          </span>
                        )}
                        {!past && (
                          <span className="ms-auto flex gap-2">
                            {s.status === "OPEN" && (
                              <form action={closeSlot.bind(null, s.id)}>
                                <button className="btn-secondary !px-3 !py-1.5">סגירה</button>
                              </form>
                            )}
                            {s.status === "CLOSED" && (
                              <form action={reopenSlot.bind(null, s.id)}>
                                <button className="btn-secondary !px-3 !py-1.5">פתיחה מחדש</button>
                              </form>
                            )}
                            {s.status !== "HELD" && s._count.appointments === 0 && (
                              <form action={deleteSlot.bind(null, s.id)}>
                                <button className="btn-danger">מחיקה</button>
                              </form>
                            )}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
