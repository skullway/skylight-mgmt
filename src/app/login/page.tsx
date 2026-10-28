import { Suspense } from "react";
import { devLoginEnabled } from "@/lib/auth";
import { LoginButtons } from "./LoginButtons";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold">כניסה לממשק הניהול</h1>
      <Suspense fallback={null}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginForm({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { callbackUrl, error } = await searchParams;
  const target = typeof callbackUrl === "string" && callbackUrl.startsWith("/") ? callbackUrl : "/admin";
  return (
    <LoginButtons
      callbackUrl={target}
      devLogin={devLoginEnabled}
      error={typeof error === "string" ? error : undefined}
    />
  );
}
