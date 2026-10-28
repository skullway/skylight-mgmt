"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { buildBookingUrl } from "@/lib/clinics/deepLink";
import { firstIssue, formValues, type FormState } from "@/lib/forms";

const FIELDS = ["name", "address", "siteUrl", "integration", "bookingUrlTemplate"] as const;

function isHttpUrl(s: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(s).protocol);
  } catch {
    return false;
  }
}

const clinicSchema = z
  .object({
    name: z.string().min(2, "שם הקליניקה קצר מדי"),
    address: z.string().transform((v) => v || null),
    siteUrl: z
      .string()
      .refine((v) => !v || isHttpUrl(v), "כתובת האתר אינה תקינה")
      .transform((v) => v || null),
    integration: z.enum(["DEEP_LINK", "MANUAL"], "סוג החיבור אינו תקין"),
    bookingUrlTemplate: z.string().transform((v) => v || null),
  })
  .refine((d) => d.integration !== "DEEP_LINK" || d.bookingUrlTemplate, {
    message: "בחיבור מסוג קישור ישיר צריך למלא תבנית קישור",
  })
  .refine(
    (d) => !d.bookingUrlTemplate || isHttpUrl(buildBookingUrl(d.bookingUrlTemplate, new Date(), new Date())),
    { message: "תבנית הקישור אינה כתובת תקינה" }
  );

export async function createClinic(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, FIELDS);
  const parsed = clinicSchema.safeParse(values);
  if (!parsed.success) return { error: firstIssue(parsed.error), values };

  await db.clinic.create({ data: parsed.data });
  redirect("/admin/clinics");
}

export async function updateClinic(id: string, _: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formValues(formData, FIELDS);
  const parsed = clinicSchema.safeParse(values);
  if (!parsed.success) return { error: firstIssue(parsed.error), values };

  await db.clinic.update({ where: { id }, data: parsed.data });
  redirect("/admin/clinics");
}

export async function setClinicActive(id: string, active: boolean) {
  await requireAdmin();
  await db.clinic.update({ where: { id }, data: { active } });
  refresh();
}
