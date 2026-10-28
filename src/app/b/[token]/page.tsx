import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { formatDay, timeKey } from "@/lib/time";
import { cancelBooking } from "./actions";
import { ConfirmButton } from "@/components/ConfirmButton";

// The URL is the guest's credential: keep it out of search engines and Referer headers.
export const metadata: Metadata = {
  title: "הפגישה שלי · Skylight",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const STATUS = {
  PENDING: { title: "הבקשה התקבלה", text: "הבקשה ממתינה לאישור. עדכון יישלח בוואטסאפ.", className: "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  CONFIRMED: { title: "הפגישה אושרה", text: "נתראה בקרוב.", className: "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200" },
  DENIED: { title: "הבקשה לא אושרה", text: "אפשר לבחור מועד אחר.", className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200" },
  CANCELLED: { title: "הפגישה בוטלה", text: "אפשר לקבוע מועד חדש בכל זמן.", className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200" },
} as const;

export default function ManageBookingPage({ params, searchParams }: PageProps<"/b/[token]">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">הפגישה שלי</h1>
      <Suspense fallback={<p className="text-zinc-500">טוען…</p>}>
        <Booking params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Booking({
  params,
  searchParams,
}: {
  params: PageProps<"/b/[token]">["params"];
  searchParams: PageProps<"/b/[token]">["searchParams"];
}) {
  const [{ token }, { new: isNew }] = await Promise.all([params, searchParams]);
  const appt = await db.appointment.findUnique({
    where: { manageToken: token },
    include: { slot: true, clinic: true },
  });
  if (!appt) notFound();

  const status = STATUS[appt.status];
  const upcoming = appt.slot.startsAt > new Date();
  const cancellable = upcoming && (appt.status === "PENDING" || appt.status === "CONFIRMED");

  return (
    <div className="flex flex-col gap-6">
      {isNew && appt.status === "PENDING" && (
        <p className="card text-sm">
          כדאי לשמור את הקישור לדף הזה. דרכו אפשר לבדוק את סטטוס הבקשה ולבטל אותה.
        </p>
      )}
      <div className={`rounded-lg p-4 ${status.className}`}>
        <div className="font-medium">{status.title}</div>
        <div className="text-sm">{status.text}</div>
        {appt.status === "DENIED" && appt.denyReason && <div className="mt-1 text-sm">סיבה: {appt.denyReason}</div>}
      </div>

      <dl className="card grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-zinc-500">מועד</dt>
        <dd>
          {formatDay(appt.slot.startsAt)}, {timeKey(appt.slot.startsAt)}–{timeKey(appt.slot.endsAt)}
        </dd>
        <dt className="text-zinc-500">מקום</dt>
        <dd>
          {appt.clinic.name}
          {appt.clinic.address && <div className="text-zinc-500">{appt.clinic.address}</div>}
        </dd>
        <dt className="text-zinc-500">שם</dt>
        <dd>{appt.customerName}</dd>
        <dt className="text-zinc-500">טלפון</dt>
        <dd dir="ltr" className="text-right">
          {formatPhone(appt.customerPhone)}
        </dd>
      </dl>

      {cancellable && (
        <ConfirmButton
          action={cancelBooking.bind(null, appt.manageToken)}
          label="ביטול הפגישה"
          question="לבטל את הפגישה?"
          confirmLabel="כן, לבטל"
          backLabel="לא, להשאיר"
        />
      )}
      {(appt.status === "DENIED" || appt.status === "CANCELLED") && (
        <Link href="/book" className="btn-primary self-start">
          קביעת מועד חדש
        </Link>
      )}
    </div>
  );
}
