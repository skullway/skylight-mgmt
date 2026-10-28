import type { MessageKind } from "@/generated/prisma/client";
import { formatDateTime } from "@/lib/time";

// WhatsApp templates. When moving to Meta, submit each `text` as the template body with
// {{1}}, {{2}}... in place of the params (same order) and language "he".
export const TEMPLATES: Record<MessageKind, { name: string; text: string }> = {
  APPROVED: {
    name: "appointment_approved",
    text: "שלום {{1}}, הפגישה {{2}} {{3}} אושרה. פרטים וביטול: {{4}}",
  },
  DENIED: {
    name: "appointment_denied",
    text: "שלום {{1}}, לצערנו לא ניתן לאשר את הפגישה {{2}}. אפשר לבחור מועד אחר כאן: {{3}}",
  },
  CANCELLED: {
    name: "appointment_cancelled",
    text: "שלום {{1}}, הפגישה {{2}} {{3}} בוטלה. לקביעת מועד חדש: {{4}}",
  },
  REMINDER: {
    name: "appointment_reminder",
    text: "שלום {{1}}, תזכורת לפגישה {{2}} {{3}}. פרטים וביטול: {{4}}",
  },
};

export type MessageAppointment = {
  customerName: string;
  manageToken: string;
  slot: { startsAt: Date };
  clinic: { name: string };
};

export function siteUrl(): string {
  return (process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function messageParams(kind: MessageKind, appt: MessageAppointment): string[] {
  const when = `ב${formatDateTime(appt.slot.startsAt)}`; // "ביום שלישי, 3 בנובמבר, 09:00"
  const where = `ב${appt.clinic.name}`;
  const link = `${siteUrl()}/b/${appt.manageToken}`;
  return kind === "DENIED" ? [appt.customerName, when, link] : [appt.customerName, when, where, link];
}

export function renderMessage(kind: MessageKind, params: string[]): string {
  return TEMPLATES[kind].text.replace(/\{\{(\d+)\}\}/g, (_, i: string) => params[Number(i) - 1] ?? "");
}
