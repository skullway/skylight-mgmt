"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { acceptAppointment, denyAppointment } from "@/lib/appointments";

export async function acceptRequest(id: string) {
  await requireAdmin();
  await acceptAppointment(id);
  refresh();
}

export async function denyRequest(id: string, formData: FormData) {
  await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300) || null;
  await denyAppointment(id, reason);
  refresh();
}
