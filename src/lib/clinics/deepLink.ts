import { formatInTimeZone } from "date-fns-tz";

export const CLINIC_TZ = "Asia/Jerusalem";

// Fills {date} (yyyy-MM-dd), {start} and {end} (HH:mm) in clinic-local time.
export function buildBookingUrl(template: string, startsAt: Date, endsAt: Date): string {
  const values: Record<string, string> = {
    date: formatInTimeZone(startsAt, CLINIC_TZ, "yyyy-MM-dd"),
    start: formatInTimeZone(startsAt, CLINIC_TZ, "HH:mm"),
    end: formatInTimeZone(endsAt, CLINIC_TZ, "HH:mm"),
  };
  return template.replace(/\{(date|start|end)\}/g, (_, key: string) =>
    encodeURIComponent(values[key])
  );
}
