import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string | null;
      role?: string | null;
      tenantId?: string | null;
      companyId?: string | null;
      tenantSlug?: string | null;
    };
  }

  interface User {
    id?: string | null;
    role?: string | null;
    tenantId?: string | null;
    companyId?: string | null;
    tenantSlug?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string | null;
    role?: string | null;
    tenantId?: string | null;
    companyId?: string | null;
    tenantSlug?: string | null;
  }
}

export {};

