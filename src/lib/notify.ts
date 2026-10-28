import "server-only";
import type { MessageKind } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { messageParams, renderMessage, TEMPLATES, type MessageAppointment } from "@/lib/messages";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

// Sends one WhatsApp message and records the attempt in MessageLog.
// Never throws: a failed message must not fail the action that triggered it.
export async function notify(
  kind: MessageKind,
  appt: MessageAppointment & { id: string; customerPhone: string }
): Promise<boolean> {
  const params = messageParams(kind, appt);
  try {
    const { providerMessageId } = await sendWhatsAppTemplate(
      appt.customerPhone,
      TEMPLATES[kind].name,
      params,
      renderMessage(kind, params)
    );
    await db.messageLog.create({ data: { appointmentId: appt.id, kind, status: "SENT", providerMessageId } });
    if (kind === "REMINDER") await db.appointment.update({ where: { id: appt.id }, data: { reminderSentAt: new Date() } });
    return true;
  } catch (e) {
    console.error(`notify ${kind} for ${appt.id} failed`, e);
    await db.messageLog
      .create({ data: { appointmentId: appt.id, kind, status: "FAILED", error: String(e).slice(0, 1000) } })
      .catch((logError) => console.error("could not record failed message", logError));
    return false;
  }
}
