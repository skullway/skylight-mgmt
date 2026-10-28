import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma, RoomReservationStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getProvider } from "@/lib/clinics";

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
    const appt = await tx.appointment.findUnique({ where, include: { slot: true, clinic: true } });
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

// PENDING -> CONFIRMED, then asks the clinic provider how the room gets reserved.
// Returns null when the appointment wasn't pending (or its slot already passed).
export async function acceptAppointment(id: string) {
  const { count } = await db.appointment.updateMany({
    where: { id, status: "PENDING", slot: { startsAt: { gt: new Date() } } },
    data: { status: "CONFIRMED", decidedAt: new Date() },
  });
  if (count === 0) return null;

  const appt = await db.appointment.findUniqueOrThrow({ where: { id }, include: { slot: true, clinic: true } });
  const reservation = await getProvider(appt.clinic).reserveRoom({
    startsAt: appt.slot.startsAt,
    endsAt: appt.slot.endsAt,
    idempotencyKey: appt.id,
  });
  if (reservation.kind === "reserved") {
    await db.appointment.update({
      where: { id },
      data: { roomStatus: "RESERVED", clinicReservationRef: reservation.reservationRef },
    });
  }
  return { appt, reservation };
}

// PENDING -> DENIED and frees the slot (or closes it if it already passed).
export async function denyAppointment(id: string, reason: string | null) {
  return db.$transaction(async (tx) => {
    const { count } = await tx.appointment.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "DENIED", decidedAt: new Date(), denyReason: reason },
    });
    if (count === 0) return null;

    const appt = await tx.appointment.findUniqueOrThrow({ where: { id }, include: { slot: true, clinic: true } });
    await tx.availabilitySlot.update({
      where: { id: appt.slotId },
      data: { status: appt.slot.startsAt > new Date() ? "OPEN" : "CLOSED" },
    });
    return appt;
  });
}

export async function setRoomStatus(id: string, roomStatus: RoomReservationStatus) {
  await db.appointment.update({ where: { id }, data: { roomStatus } });
}
