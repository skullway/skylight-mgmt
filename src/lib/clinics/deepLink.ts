import { dayKey, timeKey } from "@/lib/time";

export const PLACEHOLDERS = ["{date}", "{start}", "{end}"] as const;

// Fills {date} (yyyy-MM-dd), {start} and {end} (HH:mm) in clinic-local time.
export function buildBookingUrl(template: string, startsAt: Date, endsAt: Date): string {
  const values: Record<string, string> = {
    date: dayKey(startsAt),
    start: timeKey(startsAt),
    end: timeKey(endsAt),
  };
  return template.replace(/\{(date|start|end)\}/g, (_, key: string) =>
    encodeURIComponent(values[key])
  );
}
