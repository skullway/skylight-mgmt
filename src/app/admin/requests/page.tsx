import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { formatDateTime, timeKey } from "@/lib/time";
import { ContactLinks } from "../ContactLinks";
import { acceptRequest, denyRequest } from "./actions";
import { DenyForm } from "./DenyForm";

export default function RequestsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">בקשות ממתינות</h1>
      <Suspense fallback={<p className="text-zinc-500">טוען…</p>}>
        <PendingList />
      </Suspense>
    </div>
  );
}

async function PendingList() {
  await requireAdminPage();
  const pending = await db.appointment.findMany({
    where: { status: "PENDING" },
    orderBy: { slot: { startsAt: "asc" } },
    include: { slot: true, clinic: { select: { name: true } } },
  });
  if (pending.length === 0) return <p className="text-zinc-500">אין בקשות ממתינות.</p>;

  const now = new Date();
  return (
    <ul className="flex flex-col gap-3">
      {pending.map((a) => {
        const expired = a.slot.startsAt <= now;
        return (
          <li key={a.id} className={`card flex flex-col gap-3 ${expired ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-medium">
                {formatDateTime(a.slot.startsAt)}–{timeKey(a.slot.endsAt)} · {a.clinic.name}
              </div>
              <div className="text-xs text-zinc-500">התקבלה {formatDateTime(a.createdAt)}</div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>{a.customerName}</span>
              <ContactLinks phone={a.customerPhone} />
            </div>
            {a.customerNote && (
              <p className="rounded-md bg-zinc-50 p-2 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {a.customerNote}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {expired ? (
                <span className="text-sm text-zinc-500">מועד הבקשה עבר</span>
              ) : (
                <form action={acceptRequest.bind(null, a.id)}>
                  <button className="btn-primary">אישור</button>
                </form>
              )}
              <DenyForm action={denyRequest.bind(null, a.id)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
