"use client";

import { useState } from "react";

export function DenyForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="btn-danger" onClick={() => setOpen(true)}>
        דחייה
      </button>
    );
  }
  return (
    <form action={action} className="flex w-full flex-wrap items-center gap-2">
      <input name="reason" className="input flex-1" placeholder="סיבה (לא חובה, תוצג ללקוח)" maxLength={300} />
      <button className="btn-danger">אישור דחייה</button>
      <button type="button" className="btn-secondary !px-3 !py-1.5" onClick={() => setOpen(false)}>
        ביטול
      </button>
    </form>
  );
}
