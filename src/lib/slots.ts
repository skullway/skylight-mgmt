import { db } from "@/lib/db";

export interface Interval {
  startsAt: Date;
  endsAt: Date;
}

// Half-open intervals: a slot ending at 10:00 doesn't overlap one starting at 10:00.
export function overlaps(a: Interval, b: Interval): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

// The therapist can't be in two places at once, so overlap is checked across all clinics.
export function findOverlappingSlot(interval: Interval, excludeId?: string) {
  return db.availabilitySlot.findFirst({
    where: {
      status: { not: "CLOSED" },
      startsAt: { lt: interval.endsAt },
      endsAt: { gt: interval.startsAt },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { clinic: true },
  });
}
