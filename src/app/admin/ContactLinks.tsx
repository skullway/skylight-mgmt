import { formatPhone } from "@/lib/phone";

// Phone plus a wa.me link, so the therapist can message the customer by hand.
export function ContactLinks({ phone }: { phone: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <a href={`tel:${phone}`} dir="ltr" className="hover:underline">
        {formatPhone(phone)}
      </a>
      <a
        href={`https://wa.me/${phone.replace("+", "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-green-700 hover:underline dark:text-green-400"
      >
        וואטסאפ
      </a>
    </span>
  );
}
