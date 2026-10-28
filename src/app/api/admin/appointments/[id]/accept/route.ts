import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getProvider } from "@/lib/clinics";
import { TZ } from "@/lib/time";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { count } = await db.appointment.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "CONFIRMED", decidedAt: new Date() },
  });
  if (count === 0) return NextResponse.json({ error: "Not pending" }, { status: 400 });

  const appt = await db.appointment.findUniqueOrThrow({
    where: { id },
    include: { slot: true, clinic: true },
  });

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

  // Don't fail the request if WhatsApp fails; log and retry later
  try {
    await sendWhatsAppTemplate(appt.customerPhone, "appointment_approved", [
      appt.customerName,
      appt.slot.startsAt.toLocaleString("he-IL", { timeZone: TZ }),
      appt.clinic.name,
    ]);
  } catch (e) {
    console.error(e);
  }
  return NextResponse.json({ ok: true, reservation });
}
