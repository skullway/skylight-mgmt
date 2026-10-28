import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { setClinicActive } from "./actions";

const INTEGRATION_LABEL = {
  DEEP_LINK: "קישור ישיר",
  WEB_LOGIN: "כניסה אוטומטית",
  MANUAL: "ידנית",
} as const;

export default function ClinicsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">קליניקות</h1>
        <Link href="/admin/clinics/new" className="btn-primary">
          קליניקה חדשה
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">טוען…</p>}>
        <ClinicList />
      </Suspense>
    </div>
  );
}

async function ClinicList() {
  await requireAdminPage();
  const clinics = await db.clinic.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  if (clinics.length === 0) return <p className="text-zinc-500">עדיין אין קליניקות.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {clinics.map((c) => (
        <li key={c.id} className={`card flex flex-wrap items-center gap-4 ${c.active ? "" : "opacity-60"}`}>
          <div className="flex-1">
            <div className="font-medium">
              {c.name} {!c.active && <span className="text-sm text-zinc-500">(לא פעילה)</span>}
            </div>
            <div className="text-sm text-zinc-500">
              {c.address ?? "ללא כתובת"} · {INTEGRATION_LABEL[c.integration]}
            </div>
          </div>
          <Link href={`/admin/clinics/${c.id}`} className="btn-secondary">
            עריכה
          </Link>
          <form action={setClinicActive.bind(null, c.id, !c.active)}>
            <button className="btn-secondary">{c.active ? "השבתה" : "הפעלה"}</button>
          </form>
        </li>
      ))}
    </ul>
  );
}
