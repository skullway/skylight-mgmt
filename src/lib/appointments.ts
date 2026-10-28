import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type BookingInput = {
  slotId: string;
  customerName: string;
  customerPhone: string; // E.164
  customerNote: string | null;
};

export type BookingResult = { ok: true; manageToken: string } | { ok: false; error: string };

const MAX_PENDING_PER_PHONE = 2;

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const pending = await db.appointment.count({
    where: { customerPhone: input.customerPhone, status: "PENDING" },
  });
  if (pending >= MAX_PENDING_PER_PHONE)
    return { ok: false, error: "כבר יש בקשות שממתינות לאישור מהמספר הזה. אפשר לבטל אחת מהן או לחכות לתשובה." };

  return db.$transaction(async (tx) => {
    const slot = await tx.availabilitySlot.findUnique({
      where: { id: input.slotId },
      include: { clinic: { select: { active: true } } },
    });
    if (!slot || !slot.clinic.active || slot.startsAt <= new Date())
      return { ok: false, error: "המועד הזה כבר לא זמין." } as const;

    // Only the request that flips OPEN -> HELD gets the slot; this prevents double booking
    const { count } = await tx.availabilitySlot.updateMany({
      where: { id: slot.id, status: "OPEN" },
      data: { status: "HELD" },
    });
    if (count === 0) return { ok: false, error: "מישהו אחר הספיק לקבוע את המועד הזה. אפשר לבחור מועד אחר." } as const;

    const appt = await tx.appointment.create({
      data: {
        ...input,
        clinicId: slot.clinicId,
        // Unguessable: this token is the guest's only credential for managing the booking
        manageToken: randomBytes(24).toString("base64url"),
      },
    });
    return { ok: true, manageToken: appt.manageToken } as const;
  });
}

// Cancels a PENDING or CONFIRMED appointment and frees its slot if it's still in the future.
// Returns the appointment when this call did the cancelling, null if it wasn't cancellable.
export async function cancelAppointment(where: Prisma.AppointmentWhereUniqueInput) {
  return db.$transaction(async (tx) => {
    const appt = await tx.appointment.findUnique({ where, include: { slot: true } });
    if (!appt || appt.slot.startsAt <= new Date()) return null;

    const { count } = await tx.appointment.updateMany({
      where: { id: appt.id, status: { in: ["PENDING", "CONFIRMED"] } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    if (count === 0) return null;

    await tx.availabilitySlot.update({ where: { id: appt.slotId }, data: { status: "OPEN" } });
    return appt;
  });
}
