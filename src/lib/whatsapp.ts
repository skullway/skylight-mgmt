export async function sendWhatsAppTemplate(
  to: string,
  template: "appointment_approved" | "appointment_denied" | "appointment_reminder",
  params: string[]
) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
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
          components: [
            { type: "body", parameters: params.map((text) => ({ type: "text", text })) },
          ],
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`WhatsApp error: ${await res.text()}`);
}