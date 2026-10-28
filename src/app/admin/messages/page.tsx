import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { messageParams, renderMessage } from "@/lib/messages";
import { formatPhone } from "@/lib/phone";
import { formatDateTime } from "@/lib/time";
import { whatsappMode } from "@/lib/whatsapp";
import { RunNowButton } from "./RunNowButton";

const KIND = { APPROVED: "אישור", DENIED: "דחייה", CANCELLED: "ביטול", REMINDER: "תזכורת" } as const;

export default function MessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">הודעות וואטסאפ</h1>
        <RunNowButton />
      </div>
      <Suspense fallback={<p className="text-zinc-500">טוען…</p>}>
        <MessageLogList />
      </Suspense>
    </div>
  );
}

async function MessageLogList() {
  await requireAdminPage();
  const logs = await db.messageLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { appointment: { include: { slot: true, clinic: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      {whatsappMode() === "fake" && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          מצב בדיקה: הודעות לא נשלחות באמת. הן נרשמות כאן כדי לראות מה היה נשלח. לשליחה אמיתית צריך להגדיר
          WHATSAPP_MODE=meta.
        </p>
      )}
      {logs.length === 0 ? (
        <p className="text-zinc-500">עדיין לא נשלחו הודעות.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {logs.map((log) => (
            <li key={log.id} className="card flex flex-col gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{KIND[log.kind]}</span>
                <span>{log.appointment.customerName}</span>
                <span dir="ltr" className="text-zinc-500">
                  {formatPhone(log.appointment.customerPhone)}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    log.status === "SENT"
                      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                  }`}
                >
                  {log.status === "SENT" ? "נשלחה" : "נכשלה"}
                </span>
                <span className="ms-auto text-xs text-zinc-500">{formatDateTime(log.createdAt)}</span>
              </div>
              {/* Rebuilt from current appointment data, so it shows what the template produces */}
              <p className="rounded-md bg-zinc-50 p-2 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {renderMessage(log.kind, messageParams(log.kind, log.appointment))}
              </p>
              {log.error && (
                <p dir="ltr" className="break-all text-left font-mono text-xs text-red-700 dark:text-red-400">
                  {log.error}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
