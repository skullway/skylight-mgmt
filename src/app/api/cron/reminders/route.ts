import { NextResponse } from "next/server";
import { runDailyMessages } from "@/lib/reminders";

// Vercel cron (vercel.json) calls this once a day with "Authorization: Bearer $CRON_SECRET".
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new NextResponse("Unauthorized", { status: 401 });

  return NextResponse.json(await runDailyMessages());
}
