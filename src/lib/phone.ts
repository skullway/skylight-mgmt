// Normalizes what people type ("050-123 4567", "+972 50 1234567", "00972...") to E.164.
// Local Israeli numbers (leading 0) get +972. Returns null when it can't be a valid number.
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("00")) digits = "+" + digits.slice(2);
  else if (digits.startsWith("972")) digits = "+" + digits;
  else if (digits.startsWith("0")) digits = "+972" + digits.slice(1);

  if (!/^\+\d{10,15}$/.test(digits)) return null;
  // Israeli numbers must be mobile (05x) so WhatsApp can reach them
  if (digits.startsWith("+972") && !/^\+9725\d{8}$/.test(digits)) return null;
  return digits;
}

// +972501234567 -> 050-123-4567 (other countries are shown as-is)
export function formatPhone(e164: string): string {
  const m = e164.match(/^\+972(5\d)(\d{3})(\d{4})$/);
  return m ? `0${m[1]}-${m[2]}-${m[3]}` : e164;
}
