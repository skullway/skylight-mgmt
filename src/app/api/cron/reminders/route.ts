import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { db } from "@/lib/db";
import { TZ } from "@/lib/time";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

// Runs once a day (vercel.json) and reminds everyone with an appointment tomorrow, Israel time.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new NextResponse("Unauthorized", { status: 401 });

  const tomorrow = formatInTimeZone(addDays(new Date(), 1), TZ, "yyyy-MM-dd");
  const from = fromZonedTime(`${tomorrow}T00:00:00`, TZ);
  const to = addDays(from, 1);

  const due = await db.appointment.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      slot: { startsAt: { gte: from, lt: to } },
    },
    include: { slot: true, clinic: true },
  });

  let sent = 0;
  for (const a of due) {
    try {
      await sendWhatsAppTemplate(a.customerPhone, "appointment_reminder", [
        a.customerName,
        a.slot.startsAt.toLocaleString("he-IL", { timeZone: TZ }),
        a.clinic.name,
      ]);
      await db.appointment.update({ where: { id: a.id }, data: { reminderSentAt: new Date() } });
      sent++;
    } catch (e) {
      console.error(e);
    }
  }
  return NextResponse.json({ due: due.length, sent });
}
