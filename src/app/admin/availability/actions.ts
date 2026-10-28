"use server";

import { refresh } from "next/cache";
import { addMinutes, differenceInMinutes } from "date-fns";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { findOverlappingSlot } from "@/lib/slots";
import { dayKey, isDayKey, timeKey, zonedToUtc } from "@/lib/time";
import { firstIssue, formValues, type FormState } from "@/lib/forms";

const FIELDS = ["clinicId", "day", "start", "end"] as const;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const slotSchema = z.object({
  clinicId: z.string().min(1, "צריך לבחור קליניקה"),
  day: z.string().refine(isDayKey, "התאריך אינו תקין"),
  start: z.string().regex(HHMM, "שעת ההתחלה אינה תקינה"),
  end: z.string().regex(HHMM, "שעת הסיום אינה תקינה"),
});

export async function createSlot(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, FIELDS);
  const parsed = slotSchema.safeParse(values);
  if (!parsed.success) return { error: firstIssue(parsed.error), values };

  const { clinicId, day, start, end } = parsed.data;
  const startsAt = zonedToUtc(day, start);
  const endsAt = zonedToUtc(day, end);
  if (endsAt <= startsAt) return { error: "שעת הסיום צריכה להיות אחרי שעת ההתחלה", values };
  if (startsAt <= new Date()) return { error: "אי אפשר להוסיף משבצת בעבר", values };

  const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic?.active) return { error: "הקליניקה לא נמצאה או שאינה פעילה", values };

  const clash = await findOverlappingSlot({ startsAt, endsAt });
  if (clash) {
    return {
      error: `חופף למשבצת ${timeKey(clash.startsAt)}–${timeKey(clash.endsAt)} ב${clash.clinic.name}`,
      values,
    };
  }

  try {
    await db.availabilitySlot.create({ data: { clinicId, startsAt, endsAt } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { error: "כבר קיימת משבצת בשעה הזו בקליניקה הזו", values };
    throw e;
  }
  refresh();

  // Prefill the next back-to-back slot of the same length
  const nextEnd = addMinutes(endsAt, differenceInMinutes(endsAt, startsAt));
  return {
    message: `נוספה משבצת ${start}–${end}`,
    values: {
      clinicId,
      day: dayKey(nextEnd) === day ? day : dayKey(endsAt),
      start: end,
      end: dayKey(nextEnd) === day ? timeKey(nextEnd) : end,
    },
  };
}

// Status transitions are conditional updates, so a stale button can't break a slot's state.
export async function closeSlot(id: string) {
  await requireAdmin();
  await db.availabilitySlot.updateMany({ where: { id, status: "OPEN" }, data: { status: "CLOSED" } });
  refresh();
}

export async function reopenSlot(id: string) {
  await requireAdmin();
  const slot = await db.availabilitySlot.findUnique({ where: { id } });
  if (!slot || slot.status !== "CLOSED" || slot.startsAt <= new Date()) return;
  if (await findOverlappingSlot(slot, slot.id)) return;
  await db.availabilitySlot.updateMany({ where: { id, status: "CLOSED" }, data: { status: "OPEN" } });
  refresh();
}

// Slots with appointment history are kept (close them instead) so past appointments stay intact.
export async function deleteSlot(id: string) {
  await requireAdmin();
  await db.availabilitySlot.deleteMany({
    where: { id, status: { not: "HELD" }, appointments: { none: {} } },
  });
  refresh();
}
