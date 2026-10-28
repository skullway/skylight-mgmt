import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">הדף לא נמצא</h1>
      <p className="text-zinc-600 dark:text-zinc-400">ייתכן שהקישור שגוי או שכבר אינו בתוקף.</p>
      <Link href="/" className="btn-secondary">
        לדף הבית
      </Link>
    </main>
  );
}
