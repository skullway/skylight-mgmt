"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/forms";
import { createSlot } from "./actions";

export function AddSlotForm({
  clinics,
  defaultDay,
}: {
  clinics: { id: string; name: string }[];
  defaultDay: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createSlot, {});
  const values = { clinicId: clinics[0]?.id ?? "", day: defaultDay, start: "09:00", end: "09:50", ...state.values };

  if (clinics.length === 0) return <p className="text-zinc-500">כדי להוסיף משבצות צריך קודם להוסיף קליניקה פעילה.</p>;

  return (
    <form action={formAction} className="card flex flex-col gap-3">
      <h2 className="font-medium">הוספת משבצת</h2>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.message && <p className="text-sm text-green-700 dark:text-green-400">{state.message}</p>}
      {/* key re-mounts the fields so defaults follow the latest server state */}
      <div key={JSON.stringify(values)} className="grid gap-3 sm:grid-cols-5">
        <label className="label sm:col-span-2">
          קליניקה
          <select name="clinicId" className="input" defaultValue={values.clinicId}>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="label">
          תאריך
          <input type="date" name="day" className="input" defaultValue={values.day} required />
        </label>
        <label className="label">
          התחלה
          <input type="time" name="start" className="input" defaultValue={values.start} step={300} required />
        </label>
        <label className="label">
          סיום
          <input type="time" name="end" className="input" defaultValue={values.end} step={300} required />
        </label>
      </div>
      <div>
        <button className="btn-primary" disabled={pending}>
          {pending ? "מוסיף…" : "הוספה"}
        </button>
      </div>
    </form>
  );
}
