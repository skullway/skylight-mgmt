import "server-only";
import type { AppointmentStatus, MessageKind } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { dayKey, dayRange, shiftDay } from "@/lib/time";

// A failed message is only worth retrying while the appointment is still in the state it announced.
const STILL_RELEVANT: Record<MessageKind, AppointmentStatus> = {
  APPROVED: "CONFIRMED",
  DENIED: "DENIED",
  CANCELLED: "CANCELLED",
  REMINDER: "CONFIRMED",
};

// Daily job (Vercel cron, or the button on /admin/messages):
// 1. remind everyone with a confirmed appointment tomorrow (Israel time)
// 2. retry messages that failed in the last 24 hours and never succeeded since
export async function runDailyMessages(now = new Date()) {
  const { from, to } = dayRange(shiftDay(dayKey(now), 1));
  const due = await db.appointment.findMany({
    where: { status: "CONFIRMED", reminderSentAt: null, slot: { startsAt: { gte: from, lt: to } } },
    include: { slot: true, clinic: true },
  });
  let reminded = 0;
  for (const a of due) if (await notify("REMINDER", a)) reminded++;

  const failed = await db.messageLog.findMany({
    where: { status: "FAILED", createdAt: { gte: new Date(now.getTime() - 864e5) } },
    include: { appointment: { include: { slot: true, clinic: true, messages: true } } },
  });
  const retry = new Map<string, (typeof failed)[number]>();
  for (const f of failed) {
    const a = f.appointment;
    const succeeded = a.messages.some((m) => m.kind === f.kind && m.status === "SENT");
    if (succeeded || a.status !== STILL_RELEVANT[f.kind] || a.slot.startsAt <= now) continue;
    retry.set(`${a.id}:${f.kind}`, f); // one retry per appointment+kind, however many failures
  }
  let retried = 0;
  for (const f of retry.values()) if (await notify(f.kind, f.appointment)) retried++;

  return { reminders: due.length, reminded, retries: retry.size, retried };
}
