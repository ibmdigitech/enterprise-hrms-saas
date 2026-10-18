import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/SidebarOptimized";
import { AppHeader } from "@/components/layout/AppHeader";
import { Toaster } from "sonner";
import { Providers } from "@/components/common/Providers";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR Portal",
  description: "Enterprise HR Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  let userWithPhoto = session?.user;
  let currentTenantName: string | null = null;
  let userTenants: Array<{ id: string; name: string; slug: string; role: string }> = [];

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

        // Display current company name or tenant name
        currentTenantName =
          dbUser.employee?.company?.name ||
          dbUser.employee?.tenant?.name ||
          dbUser.memberships[0]?.tenant?.name ||
          null;

        // ONLY provide switchable organizations if user is SUPER_ADMIN or holds multiple authorized memberships
        if (dbUser.role === "SUPER_ADMIN") {
          const allTenants = await prisma.tenant.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, name: true, slug: true },
            take: 25,
          });
          userTenants = allTenants.map((t) => ({ ...t, role: "SUPER_ADMIN" }));
        } else if (dbUser.memberships && dbUser.memberships.length > 1) {
          userTenants = dbUser.memberships.map((m) => ({
            id: m.tenant.id,
            name: m.tenant.name,
            slug: m.tenant.slug,
            role: m.role,
          }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch user context from db:", e);
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 dark:bg-slate-900`}
      >
        <Providers>
          <div className="flex h-screen overflow-hidden">
            {isLoggedIn && <Sidebar user={userWithPhoto} currentTenantName={currentTenantName} />}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              {isLoggedIn && (
                <AppHeader
                  user={userWithPhoto}
                  currentTenantName={currentTenantName}
                  tenants={userTenants}
                />
              )}
              <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
