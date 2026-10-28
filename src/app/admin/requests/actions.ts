"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { acceptAppointment, denyAppointment } from "@/lib/appointments";
import { notify } from "@/lib/notify";

export async function acceptRequest(id: string) {
  await requireAdmin();
  const accepted = await acceptAppointment(id);
  if (accepted) after(() => notify("APPROVED", accepted.appt));
  refresh();
}

export async function denyRequest(id: string, formData: FormData) {
  await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300) || null;
  const denied = await denyAppointment(id, reason);
  if (denied) after(() => notify("DENIED", denied));
  refresh();
}
