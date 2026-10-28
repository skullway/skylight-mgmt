"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { createBooking } from "@/lib/appointments";
import { normalizePhone } from "@/lib/phone";
import { firstIssue, formValues, type FormState } from "@/lib/forms";

const FIELDS = ["slotId", "customerName", "customerPhone", "customerNote", "website"] as const;

const bookingSchema = z.object({
  slotId: z.string().min(1, "צריך לבחור מועד"),
  customerName: z.string().min(2, "צריך למלא שם מלא").max(80, "השם ארוך מדי"),
  customerPhone: z
    .string()
    .transform(normalizePhone)
    .refine((v): v is string => v !== null, "מספר הטלפון אינו תקין. למשל: 050-1234567"),
  customerNote: z
    .string()
    .max(500, "ההערה ארוכה מדי")
    .transform((v) => v || null),
  website: z.literal(""), // honeypot: hidden from people, bots tend to fill it
});

export async function bookAppointment(_: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, FIELDS);
  const parsed = bookingSchema.safeParse(values);
  if (!parsed.success) return { error: firstIssue(parsed.error), values };

  const { slotId, customerName, customerPhone, customerNote } = parsed.data;
  const result = await createBooking({ slotId, customerName, customerPhone, customerNote });
  if (!result.ok) {
    refresh(); // the slot list may be stale
    return { error: result.error, values };
  }
  redirect(`/b/${result.manageToken}?new=1`);
}
