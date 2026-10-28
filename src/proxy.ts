import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Convenience redirect only. The real check is requireAdmin()/requireAdminPage() in src/lib/auth.ts.
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token?.admin) return NextResponse.next();

  const login = new URL("/login", req.url);
  login.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*"],
};
