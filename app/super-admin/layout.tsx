import { auth } from "@/auth";
import { requireSuperAdmin } from "@/lib/auth/guards";
import prisma from "@/lib/prisma";
import { SuperAdminLayoutClient } from "@/components/super-admin/SuperAdminLayoutClient";

export const metadata = {
  title: "Super Admin | Enterprise HRMS",
  description: "Platform administration for Enterprise HRMS SaaS",
};

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default async function SuperAdminLayout({
  children,
}: SuperAdminLayoutProps) {
  // Ensure the user is a Super Admin before rendering any Super Admin UI
  // This guard throws an AuthorizationError (403) if the role is insufficient,
  // which Next.js will translate into an error page. It also logs the attempt.
  await requireSuperAdmin('platform.dashboard.view');
  const session = await auth();
  const isLoggedIn = !!session?.user;

  let userWithPhoto = session?.user;
  let currentTenantName: string | null = null;

  if (isLoggedIn && session?.user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          employee: {
            select: {
              photo: true,
              tenantId: true,
              companyId: true,
              company: { select: { name: true } },
              tenant: { select: { id: true, name: true, slug: true } },
            },
          },
          memberships: {
            where: { status: "ACTIVE" },
            include: {
              tenant: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      });

      if (dbUser) {
        userWithPhoto = {
          ...session.user,
          image: dbUser.employee?.photo || dbUser.image || session.user.image,
          tenantId: dbUser.employee?.tenantId || dbUser.memberships[0]?.tenantId || null,
          tenantSlug: dbUser.employee?.tenant?.slug || dbUser.memberships[0]?.tenant?.slug || null,
        };

        currentTenantName =
          dbUser.employee?.company?.name ||
          dbUser.employee?.tenant?.name ||
          dbUser.memberships[0]?.tenant?.name ||
          null;
      }
    } catch (e) {
      console.error("Failed to fetch user context from db:", e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dark:bg-slate-950">
      <SuperAdminLayoutClient
        user={userWithPhoto}
        currentTenantName={currentTenantName}
      >
        {children}
      </SuperAdminLayoutClient>
    </div>
  );
}