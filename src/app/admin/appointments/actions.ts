"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { cancelAppointment, setRoomStatus } from "@/lib/appointments";
import { notify } from "@/lib/notify";

export async function markRoomReserved(id: string) {
  await requireAdmin();
  await setRoomStatus(id, "RESERVED");
  refresh();
}

export async function markRoomReleased(id: string) {
  await requireAdmin();
  await setRoomStatus(id, "RELEASED");
  refresh();
}

export async function cancelByTherapist(id: string) {
  await requireAdmin();
  const cancelled = await cancelAppointment({ id });
  if (cancelled) after(() => notify("CANCELLED", cancelled));
  refresh();
}
