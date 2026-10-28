import { createClinic } from "../actions";
import { ClinicForm } from "../ClinicForm";

export default function NewClinicPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">קליניקה חדשה</h1>
      <ClinicForm
        action={createClinic}
        submitLabel="יצירה"
        initial={{ name: "", address: "", siteUrl: "", integration: "DEEP_LINK", bookingUrlTemplate: "" }}
      />
    </div>
  );
}
