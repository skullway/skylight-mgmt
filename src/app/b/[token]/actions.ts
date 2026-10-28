"use server";

import { refresh } from "next/cache";
import { cancelAppointment } from "@/lib/appointments";

// The manage token is the guest's credential; possession of the link is what authorizes this.
export async function cancelBooking(manageToken: string) {
  await cancelAppointment({ manageToken });
  refresh();
}
