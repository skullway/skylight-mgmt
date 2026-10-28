"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button className="text-sm text-zinc-500 hover:underline" onClick={() => signOut({ callbackUrl: "/" })}>
      יציאה
    </button>
  );
}
