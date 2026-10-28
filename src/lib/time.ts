import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

// Every clinic is in Israel; all user-facing dates and times are in this zone.
export const TZ = "Asia/Jerusalem";

// "2026-11-03" + "09:30" (Israel time) -> UTC Date
export function zonedToUtc(day: string, time: string): Date {
  return fromZonedTime(`${day}T${time}:00`, TZ);
}

// UTC Date -> "2026-11-03" in Israel time
export function dayKey(d: Date): string {
  return formatInTimeZone(d, TZ, "yyyy-MM-dd");
}

// UTC Date -> "09:30" in Israel time
export function timeKey(d: Date): string {
  return formatInTimeZone(d, TZ, "HH:mm");
}

// [start, end) of an Israel calendar day, in UTC
export function dayRange(day: string): { from: Date; to: Date } {
  const from = zonedToUtc(day, "00:00");
  return { from, to: zonedToUtc(dayKey(addDays(from, 1)), "00:00") };
}

// Sunday that starts the Israel week containing `day`
export function weekStart(day: string): string {
  const noon = zonedToUtc(day, "12:00");
  const weekday = Number(formatInTimeZone(noon, TZ, "i")) % 7; // ISO: Mon=1..Sun=7 -> Sun=0
  return dayKey(addDays(noon, -weekday));
}

export function shiftDay(day: string, days: number): string {
  return dayKey(addDays(zonedToUtc(day, "12:00"), days));
}

export function isDayKey(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// "יום שלישי, 3 בנובמבר"
export function formatDay(d: Date): string {
  return d.toLocaleDateString("he-IL", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
}

// "יום שלישי, 3 בנובמבר, 09:30"
export function formatDateTime(d: Date): string {
  return `${formatDay(d)}, ${timeKey(d)}`;
}
