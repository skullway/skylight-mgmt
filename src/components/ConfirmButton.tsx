"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

// Two-step button for destructive Server Actions: first click asks, second click submits.
export function ConfirmButton({
  action,
  label,
  question,
  confirmLabel,
  backLabel = "חזרה",
}: {
  action: () => Promise<void>;
  label: string;
  question?: string;
  confirmLabel: string;
  backLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>
        {label}
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      {question && <span className="text-sm">{question}</span>}
      <Submit label={confirmLabel} />
      <button type="button" className="btn-secondary !px-3 !py-1.5" onClick={() => setConfirming(false)}>
        {backLabel}
      </button>
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-danger" disabled={pending}>
      {pending ? "רגע…" : label}
    </button>
  );
}
