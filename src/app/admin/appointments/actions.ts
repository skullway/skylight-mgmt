"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { cancelAppointment, setRoomStatus } from "@/lib/appointments";

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
  await cancelAppointment({ id });
  refresh();
}
