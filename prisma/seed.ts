// Fake development data. Wipes all app tables first, so never point this at production.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { dayKey, shiftDay, zonedToUtc } from "../src/lib/time";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed with NODE_ENV=production");
  process.exit(1);
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
});

const TIMES = ["09:00", "10:00", "11:00", "16:00", "17:00"];
const SESSION_MINUTES = 50;

const CUSTOMERS = [
  { customerName: "דנה לוי", customerPhone: "+972500000001" },
  { customerName: "יוסי כהן", customerPhone: "+972500000002" },
  { customerName: "נועה מזרחי", customerPhone: "+972500000003" },
  { customerName: "אבי פרץ", customerPhone: "+972500000004" },
  { customerName: "מיכל ביטון", customerPhone: "+972500000005" },
  { customerName: "רון אברהם", customerPhone: "+972500000006" },
  { customerName: "שירה גולן", customerPhone: "+972500000007" },
];

function slotTimes(day: string, time: string) {
  const startsAt = zonedToUtc(day, time);
  return { startsAt, endsAt: new Date(startsAt.getTime() + SESSION_MINUTES * 60_000) };
}

async function main() {
  await db.messageLog.deleteMany();
  await db.appointment.deleteMany();
  await db.availabilitySlot.deleteMany();
  await db.clinic.deleteMany();

  const clinics = await Promise.all([
    db.clinic.create({
      data: {
        name: "קליניקת השקמה",
        address: "רחוב השקמה 12, תל אביב",
        siteUrl: "https://clinic-a.example",
        integration: "DEEP_LINK",
        bookingUrlTemplate: "https://clinic-a.example/rooms/book?date={date}&from={start}&to={end}",
      },
    }),
    db.clinic.create({
      data: {
        name: "מרכז טיפולי הגפן",
        address: "שדרות הגפן 5, רמת גן",
        siteUrl: "https://clinic-b.example",
        integration: "DEEP_LINK",
        bookingUrlTemplate: "https://clinic-b.example/reserve?day={date}&time={start}",
      },
    }),
    db.clinic.create({
      data: { name: "חדרי טיפול הכרמל", address: "רחוב הכרמל 30, חיפה", integration: "MANUAL" },
    }),
  ]);

  // Slots for yesterday through two weeks out, skipping Saturdays. Each day uses one clinic.
  const today = dayKey(new Date());
  const slots: { id: string; day: string; time: string }[] = [];
  for (let offset = -1; offset <= 14; offset++) {
    const day = shiftDay(today, offset);
    if (zonedToUtc(day, "12:00").getUTCDay() === 6) continue;
    const clinic = clinics[(offset + 3) % clinics.length];
    for (const time of TIMES) {
      const slot = await db.availabilitySlot.create({ data: { clinicId: clinic.id, ...slotTimes(day, time) } });
      slots.push({ id: slot.id, day, time });
    }
  }

  const pick = (offset: number, time: string) => {
    const day = shiftDay(today, offset);
    return slots.find((s) => s.day === day && s.time === time) ?? slots.find((s) => s.day > day)!;
  };

  type Seed = {
    offset: number;
    time: string;
    status: "PENDING" | "CONFIRMED" | "DENIED";
    roomStatus?: "RESERVED";
    note?: string;
  };
  const plan: Seed[] = [
    { offset: -1, time: "10:00", status: "CONFIRMED", roomStatus: "RESERVED" },
    { offset: 1, time: "09:00", status: "CONFIRMED", roomStatus: "RESERVED" }, // reminder candidate
    { offset: 3, time: "16:00", status: "CONFIRMED" },
    { offset: 2, time: "10:00", status: "PENDING", note: "פגישה ראשונה" },
    { offset: 4, time: "11:00", status: "PENDING" },
    { offset: 5, time: "17:00", status: "PENDING" },
    { offset: 2, time: "16:00", status: "DENIED" },
  ];

  for (const [i, a] of plan.entries()) {
    const slot = pick(a.offset, a.time);
    const full = await db.availabilitySlot.findUniqueOrThrow({ where: { id: slot.id } });
    await db.appointment.create({
      data: {
        slotId: full.id,
        clinicId: full.clinicId,
        ...CUSTOMERS[i],
        customerNote: a.note,
        status: a.status,
        roomStatus: a.roomStatus,
        decidedAt: a.status === "PENDING" ? null : new Date(),
        denyReason: a.status === "DENIED" ? "המועד כבר לא מתאים" : null,
      },
    });
    // Denied appointments free their slot; active ones hold it
    if (a.status !== "DENIED") await db.availabilitySlot.update({ where: { id: full.id }, data: { status: "HELD" } });
  }

  console.log(`Seeded ${clinics.length} clinics, ${slots.length} slots, ${plan.length} appointments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
