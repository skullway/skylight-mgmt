import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { buildBookingUrl } from "@/lib/clinics/deepLink";
import { dayKey, formatDateTime, formatDay, timeKey } from "@/lib/time";
import { ConfirmButton } from "@/components/ConfirmButton";
import type { Clinic } from "@/generated/prisma/client";
import { ContactLinks } from "../ContactLinks";
import { cancelByTherapist, markRoomReleased, markRoomReserved } from "./actions";

export default function AppointmentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">פגישות קרובות</h1>
      <Suspense fallback={<p className="text-zinc-500">טוען…</p>}>
        <Upcoming />
      </Suspense>
    </div>
  );
}

const ROOM = {
  NOT_STARTED: { label: "חדר לא הוזמן", className: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  RESERVED: { label: "חדר הוזמן", className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
  FAILED: { label: "הזמנת החדר נכשלה", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
  RELEASED: { label: "החדר שוחרר", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400" },
} as const;

// Where the therapist goes to book or cancel the room: the prefilled deep link, else the clinic's site
function clinicLink(clinic: Clinic, startsAt: Date, endsAt: Date): string | null {
  if (clinic.integration === "DEEP_LINK" && clinic.bookingUrlTemplate)
    return buildBookingUrl(clinic.bookingUrlTemplate, startsAt, endsAt);
  return clinic.siteUrl;
}

async function Upcoming() {
  await requireAdminPage();
  const now = new Date();
  const [confirmed, toRelease] = await Promise.all([
    db.appointment.findMany({
      where: { status: "CONFIRMED", slot: { startsAt: { gt: now } } },
      orderBy: { slot: { startsAt: "asc" } },
      include: { slot: true, clinic: true },
    }),
    // Cancelled after the room was booked: the room should be freed at the clinic
    db.appointment.findMany({
      where: { status: "CANCELLED", roomStatus: "RESERVED", slot: { startsAt: { gt: now } } },
      orderBy: { slot: { startsAt: "asc" } },
      include: { slot: true, clinic: true },
    }),
  ]);

  const days = [...new Set(confirmed.map((a) => dayKey(a.slot.startsAt)))];

  return (
    <div className="flex flex-col gap-8">
      {toRelease.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium">חדרים לשחרור (הפגישה בוטלה)</h2>
          {toRelease.map((a) => {
            const link = a.clinic.siteUrl;
            return (
              <div key={a.id} className="card flex flex-wrap items-center gap-3 border-amber-300 text-sm dark:border-amber-800">
                <span>
                  {formatDateTime(a.slot.startsAt)} · {a.clinic.name} · {a.customerName}
                </span>
                <span className="ms-auto flex gap-2">
                  {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="btn-secondary !px-3 !py-1.5">
                      לאתר הקליניקה
                    </a>
                  )}
                  <form action={markRoomReleased.bind(null, a.id)}>
                    <button className="btn-primary !px-3 !py-1.5">סימון: החדר שוחרר</button>
                  </form>
                </span>
              </div>
            );
          })}
        </section>
      )}

      {confirmed.length === 0 ? (
        <p className="text-zinc-500">אין פגישות מאושרות קרובות.</p>
      ) : (
        days.map((day) => (
          <section key={day} className="flex flex-col gap-3">
            <h2 className="font-medium">{formatDay(confirmed.find((a) => dayKey(a.slot.startsAt) === day)!.slot.startsAt)}</h2>
            {confirmed
              .filter((a) => dayKey(a.slot.startsAt) === day)
              .map((a) => {
                const link = clinicLink(a.clinic, a.slot.startsAt, a.slot.endsAt);
                return (
                  <div key={a.id} className="card flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono" dir="ltr">
                        {timeKey(a.slot.startsAt)}–{timeKey(a.slot.endsAt)}
                      </span>
                      <span className="font-medium">{a.customerName}</span>
                      <ContactLinks phone={a.customerPhone} />
                      <span className="text-sm text-zinc-500">{a.clinic.name}</span>
                      <span className={`ms-auto rounded px-2 py-0.5 text-xs ${ROOM[a.roomStatus].className}`}>
                        {ROOM[a.roomStatus].label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {a.roomStatus !== "RESERVED" && (
                        <>
                          {link && (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                              הזמנת חדר ב{a.clinic.name}
                            </a>
                          )}
                          <form action={markRoomReserved.bind(null, a.id)}>
                            <button className="btn-primary">סימון: החדר הוזמן</button>
                          </form>
                        </>
                      )}
                      <span className="ms-auto">
                        <ConfirmButton
                          action={cancelByTherapist.bind(null, a.id)}
                          label="ביטול הפגישה"
                          confirmLabel="כן, לבטל את הפגישה"
                        />
                      </span>
                    </div>
                  </div>
                );
              })}
          </section>
        ))
      )}
    </div>
  );
}
