import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { NextAuthOptions } from "next-auth";
import { getToken } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

// Local-only shortcut so the admin area can be used before Google OAuth is set up.
// `next build`/`next start` set NODE_ENV=production, so this can never be enabled in a deploy.
export const devLoginEnabled =
  process.env.NODE_ENV !== "production" && process.env.DEV_LOGIN === "true";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    ...(devLoginEnabled
      ? [
          CredentialsProvider({
            id: "dev",
            name: "Dev login",
            credentials: {},
            async authorize() {
              return { id: "dev", name: "Dev Admin", email: "dev@localhost" };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider === "dev") return devLoginEnabled;
      return isAdminEmail(user.email);
    },
    async jwt({ token, account }) {
      if (account) token.admin = account.provider === "dev" ? devLoginEnabled : isAdminEmail(token.email);
      return token;
    },
    async session({ session, token }) {
      session.user.admin = token.admin === true;
      return session;
    },
  },
};

// Reads the session JWT from the Cookie header rather than via getServerSession(), which calls
// cookies(): in Next 16 dev, cookies() throws an InvariantError while a page re-renders after a
// Server Action. headers() doesn't have that problem.
export async function getAdminSession() {
  const header = (await headers()).get("cookie") ?? "";
  const cookies = Object.fromEntries(
    header
      .split(/;\s*/)
      .filter(Boolean)
      .map((c) => [c.slice(0, c.indexOf("=")), c.slice(c.indexOf("=") + 1)])
  );
  const token = await getToken({ req: { cookies, headers: {} } as never });
  if (!token?.admin) return null;
  return { user: { name: token.name ?? null, email: token.email ?? null, admin: true } };
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

// For admin pages and data loaders: send anonymous visitors to the login page.
export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  return session;
}

// For Server Actions: proxy.ts doesn't cover them reliably, so every action checks for itself.
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
