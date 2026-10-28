import { randomUUID } from "node:crypto";

// "fake" (default) logs messages instead of sending them. Set WHATSAPP_MODE=meta, plus
// WHATSAPP_PHONE_ID and WHATSAPP_TOKEN, to send through Meta's WhatsApp Cloud API.
export function whatsappMode(): "meta" | "fake" {
  return process.env.WHATSAPP_MODE === "meta" ? "meta" : "fake";
}

export async function sendWhatsAppTemplate(
  to: string,
  template: string,
  params: string[],
  preview: string
): Promise<{ providerMessageId: string }> {
  if (whatsappMode() === "fake") {
    console.log(`[whatsapp:fake] to ${to} (${template}): ${preview}`);
    return { providerMessageId: `fake-${randomUUID()}` };
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace("+", ""),
      type: "template",
      template: {
        name: template,
        language: { code: "he" },
        components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`WhatsApp error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { messages?: { id: string }[] };
  return { providerMessageId: data.messages?.[0]?.id ?? "unknown" };
}
