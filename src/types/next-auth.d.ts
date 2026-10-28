import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { admin: boolean };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    admin?: boolean;
  }
}
