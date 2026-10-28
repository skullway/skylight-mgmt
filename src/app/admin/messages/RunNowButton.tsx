"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/forms";
import { runDailyMessagesNow } from "./actions";

export function RunNowButton() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(runDailyMessagesNow, {});
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <button className="btn-secondary" disabled={pending}>
        {pending ? "מריץ…" : "שליחת תזכורות למחר עכשיו"}
      </button>
      {state.message && <span className="text-sm text-zinc-600 dark:text-zinc-400">{state.message}</span>}
    </form>
  );
}
