"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { runDailyMessages } from "@/lib/reminders";
import type { FormState } from "@/lib/forms";

// Same job the daily cron runs; handy for testing and for catching up manually.
export async function runDailyMessagesNow(): Promise<FormState> {
  await requireAdmin();
  const r = await runDailyMessages();
  refresh();
  return { message: `תזכורות: ${r.reminded}/${r.reminders} נשלחו · ניסיונות חוזרים: ${r.retried}/${r.retries} הצליחו` };
}
