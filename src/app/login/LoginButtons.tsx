"use client";

import { signIn } from "next-auth/react";

const ERRORS: Record<string, string> = {
  AccessDenied: "החשבון הזה אינו מורשה לגשת לממשק הניהול.",
};

export function LoginButtons({
  callbackUrl,
  devLogin,
  error,
}: {
  callbackUrl: string;
  devLogin: boolean;
  error?: string;
}) {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {ERRORS[error] ?? "הכניסה נכשלה. אפשר לנסות שוב."}
        </p>
      )}
      <button className="btn-primary" onClick={() => signIn("google", { callbackUrl })}>
        כניסה עם Google
      </button>
      {devLogin && (
        <button className="btn-secondary" onClick={() => signIn("dev", { callbackUrl })}>
          כניסת פיתוח (מקומי בלבד)
        </button>
      )}
    </div>
  );
}
