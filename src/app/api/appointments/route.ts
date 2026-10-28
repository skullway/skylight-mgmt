import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  slotId: z.string(),
  customerName: z.string().trim().min(2),
  customerPhone: z.string().regex(/^\+\d{10,15}$/),
  customerNote: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const result = await db.$transaction(async (tx) => {
    const slot = await tx.availabilitySlot.findUnique({ where: { id: parsed.data.slotId } });
    if (!slot || slot.startsAt <= new Date()) return { error: "Slot not found", status: 404 } as const;

    // Only the request that flips OPEN -> HELD gets the slot; this prevents double booking
    const { count } = await tx.availabilitySlot.updateMany({
      where: { id: slot.id, status: "OPEN" },
      data: { status: "HELD" },
    });
    if (count === 0) return { error: "Slot already taken", status: 409 } as const;

    const appt = await tx.appointment.create({
      data: { ...parsed.data, clinicId: slot.clinicId },
    });
    return { appt } as const;
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(
    { id: result.appt.id, manageToken: result.appt.manageToken },
    { status: 201 }
  );
}
