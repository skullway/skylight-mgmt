"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

export function CancelButton({ action }: { action: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>
        ביטול הפגישה
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <span className="text-sm">לבטל את הפגישה?</span>
      <Submit />
      <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
        לא, להשאיר
      </button>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-danger" disabled={pending}>
      {pending ? "מבטל…" : "כן, לבטל"}
    </button>
  );
}
