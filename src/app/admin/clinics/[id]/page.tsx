import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth";
import { updateClinic } from "../actions";
import { ClinicForm } from "../ClinicForm";

export default function EditClinicPage({ params }: PageProps<"/admin/clinics/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">עריכת קליניקה</h1>
      <Suspense fallback={<p className="text-zinc-500">טוען…</p>}>
        <EditClinic params={params} />
      </Suspense>
    </div>
  );
}

async function EditClinic({ params }: { params: PageProps<"/admin/clinics/[id]">["params"] }) {
  await requireAdminPage();
  const { id } = await params;
  const clinic = await db.clinic.findUnique({ where: { id } });
  if (!clinic) notFound();

  return (
    <ClinicForm
      action={updateClinic.bind(null, clinic.id)}
      submitLabel="שמירה"
      initial={{
        name: clinic.name,
        address: clinic.address ?? "",
        siteUrl: clinic.siteUrl ?? "",
        integration: clinic.integration,
        bookingUrlTemplate: clinic.bookingUrlTemplate ?? "",
      }}
    />
  );
}
