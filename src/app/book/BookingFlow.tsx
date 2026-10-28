"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { he } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { formatDay, zonedToUtc } from "@/lib/time";
import type { FormState } from "@/lib/forms";
import { bookAppointment } from "./actions";

export type BookableSlot = { id: string; clinicId: string; day: string; start: string; end: string };
export type BookableClinic = { id: string; name: string; address: string | null };

const ANY = "any";

// Calendar cells are local dates; matching them to Israel-time day keys by their
// y/m/d parts keeps the calendar correct whatever the visitor's own time zone is.
const toLocalDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toDayKey = (d: Date) => format(d, "yyyy-MM-dd");

export function BookingFlow({ clinics, slots }: { clinics: BookableClinic[]; slots: BookableSlot[] }) {
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(bookAppointment, {});

  const clinicName = (id: string) => clinics.find((c) => c.id === id)?.name ?? "";
  const clinicSlots = clinicId === ANY ? slots : slots.filter((s) => s.clinicId === clinicId);
  const days = [...new Set(clinicSlots.map((s) => s.day))].sort();
  const daySlots = clinicSlots.filter((s) => s.day === day);
  // If the chosen slot was just taken (list refreshed), the selection quietly resets
  const selected = daySlots.find((s) => s.id === slotId) ?? null;

  if (slots.length === 0) {
    return <p className="card text-zinc-600 dark:text-zinc-400">אין כרגע מועדים פנויים. כדאי לבדוק שוב בקרוב.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <Step n={1} title="בחירת קליניקה">
        <div className="grid gap-3 sm:grid-cols-2">
          {clinics.map((c) => {
            const count = slots.filter((s) => s.clinicId === c.id).length;
            return (
              <ChoiceCard
                key={c.id}
                active={clinicId === c.id}
                disabled={count === 0}
                onClick={() => {
                  setClinicId(c.id);
                  setDay(null);
                  setSlotId(null);
                }}
              >
                <span className="font-medium">{c.name}</span>
                <span className="text-sm text-zinc-500">{count === 0 ? "אין מועדים פנויים" : c.address}</span>
              </ChoiceCard>
            );
          })}
          <ChoiceCard
            active={clinicId === ANY}
            onClick={() => {
              setClinicId(ANY);
              setDay(null);
              setSlotId(null);
            }}
          >
            <span className="font-medium">כל הקליניקות</span>
            <span className="text-sm text-zinc-500">הצגת כל המועדים הפנויים</span>
          </ChoiceCard>
        </div>
      </Step>

      {clinicId && (
        <Step n={2} title="בחירת תאריך">
          <div className="card flex justify-center">
            <DayPicker
              mode="single"
              dir="rtl"
              locale={he}
              weekStartsOn={0}
              startMonth={toLocalDate(days[0])}
              endMonth={toLocalDate(days[days.length - 1])}
              defaultMonth={toLocalDate(days[0])}
              selected={day ? toLocalDate(day) : undefined}
              disabled={(d) => !days.includes(toDayKey(d))}
              onSelect={(d) => {
                setDay(d ? toDayKey(d) : null);
                setSlotId(null);
              }}
            />
          </div>
        </Step>
      )}

      {day && (
        <Step n={3} title={`בחירת שעה · ${formatDay(zonedToUtc(day, "12:00"))}`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {daySlots.map((s) => (
              <ChoiceCard key={s.id} active={slotId === s.id} onClick={() => setSlotId(s.id)}>
                <span className="font-mono text-lg" dir="ltr">
                  {s.start}
                </span>
                {clinicId === ANY && <span className="text-xs text-zinc-500">{clinicName(s.clinicId)}</span>}
              </ChoiceCard>
            ))}
          </div>
        </Step>
      )}

      {selected && (
        <Step n={4} title="פרטים ליצירת קשר">
          <form action={formAction} className="card flex flex-col gap-4">
            <p className="text-sm">
              {formatDay(zonedToUtc(selected.day, "12:00"))}, {selected.start}–{selected.end} ·{" "}
              {clinicName(selected.clinicId)}
            </p>
            {state.error && <p className="form-error">{state.error}</p>}
            <input type="hidden" name="slotId" value={selected.id} />
            <div key={JSON.stringify(state.values ?? {})} className="flex flex-col gap-4">
              <label className="label">
                שם מלא
                <input name="customerName" className="input" autoComplete="name" defaultValue={state.values?.customerName} required />
              </label>
              <label className="label">
                טלפון נייד (לעדכונים בוואטסאפ)
                <input
                  name="customerPhone"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  className="input text-right"
                  autoComplete="tel"
                  placeholder="050-1234567"
                  defaultValue={state.values?.customerPhone}
                  required
                />
              </label>
              <label className="label">
                הערה (לא חובה)
                <textarea name="customerNote" className="input" rows={3} maxLength={500} defaultValue={state.values?.customerNote} />
              </label>
              <label className="hidden" aria-hidden="true">
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div>
              <button className="btn-primary" disabled={pending}>
                {pending ? "שולח…" : "שליחת בקשה"}
              </button>
            </div>
            <p className="text-xs text-zinc-500">הבקשה תאושר על ידי המטפל או המטפלת, ועדכון יישלח בוואטסאפ.</p>
          </form>
        </Step>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-medium">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-700 text-sm text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ChoiceCard({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-right transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-sky-600 bg-sky-50 dark:bg-sky-950"
          : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      }`}
    >
      {children}
    </button>
  );
}
