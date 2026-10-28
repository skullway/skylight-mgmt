import Link from "next/link";
import { Suspense } from "react";
import { requireAdminPage } from "@/lib/auth";
import { SignOutButton } from "./SignOutButton";

const NAV = [
  { href: "/admin", label: "לוח בקרה" },
  { href: "/admin/requests", label: "בקשות" },
  { href: "/admin/appointments", label: "פגישות" },
  { href: "/admin/availability", label: "זמינות" },
  { href: "/admin/clinics", label: "קליניקות" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-semibold">
            Skylight · ניהול
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ms-auto">
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Suspense fallback={<p className="text-zinc-500">טוען…</p>}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return children;
}
