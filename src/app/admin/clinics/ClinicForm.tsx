"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { buildBookingUrl } from "@/lib/clinics/deepLink";
import { zonedToUtc } from "@/lib/time";
import type { FormState } from "@/lib/forms";

// Fixed example slot so the preview renders the same on server and client.
const SAMPLE_START = zonedToUtc("2030-01-06", "09:00");
const SAMPLE_END = zonedToUtc("2030-01-06", "09:50");

export interface ClinicFormValues {
  name: string;
  address: string;
  siteUrl: string;
  integration: string;
  bookingUrlTemplate: string;
}

export function ClinicForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: ClinicFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = { ...initial, ...state.values };
  const [template, setTemplate] = useState(values.bookingUrlTemplate);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.error && <p className="form-error">{state.error}</p>}
      <label className="label">
        שם הקליניקה
        <input name="name" className="input" defaultValue={values.name} required />
      </label>
      <label className="label">
        כתובת
        <input name="address" className="input" defaultValue={values.address} />
      </label>
      <label className="label">
        אתר הקליניקה
        <input name="siteUrl" className="input" dir="ltr" defaultValue={values.siteUrl} placeholder="https://" />
      </label>
      <label className="label">
        הזמנת חדר
        <select name="integration" className="input" defaultValue={values.integration}>
          <option value="DEEP_LINK">קישור ישיר לאתר הקליניקה</option>
          <option value="MANUAL">ידנית</option>
          <option value="WEB_LOGIN" disabled>
            כניסה אוטומטית לאתר (בקרוב)
          </option>
        </select>
      </label>
      <label className="label">
        תבנית קישור להזמנה
        <input
          name="bookingUrlTemplate"
          className="input"
          dir="ltr"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="https://clinic.example/book?date={date}&from={start}&to={end}"
        />
        <span className="text-xs font-normal text-zinc-500">
          אפשר להשתמש ב-{"{date}"}, {"{start}"} ו-{"{end}"}. הם יוחלפו בתאריך ובשעות של הפגישה.
        </span>
      </label>
      {template && (
        <div className="text-xs text-zinc-500">
          דוגמה:{" "}
          <span dir="ltr" className="break-all font-mono">
            {buildBookingUrl(template, SAMPLE_START, SAMPLE_END)}
          </span>
        </div>
      )}
      <div className="flex gap-3">
        <button className="btn-primary" disabled={pending}>
          {pending ? "שומר…" : submitLabel}
        </button>
        <Link href="/admin/clinics" className="btn-secondary">
          ביטול
        </Link>
      </div>
    </form>
  );
}
