import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold">Skylight</h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        קביעת פגישות טיפול בקליניקה הקרובה. בוחרים מועד פנוי, ואישור נשלח בוואטסאפ.
      </p>
      <Link href="/book" className="btn-primary !px-6 !py-3 !text-base">
        קביעת פגישה
      </Link>
      <Link href="/admin" className="mt-12 text-xs text-zinc-400 hover:underline">
        כניסה לממשק הניהול
      </Link>
    </main>
  );
}
