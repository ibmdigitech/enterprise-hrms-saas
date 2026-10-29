"use client";

import { useState } from "react";
import { SuperAdminSidebar } from "@/components/super-admin/SuperAdminSidebar";
import { SuperAdminHeader } from "@/components/super-admin/SuperAdminHeader";
import { Toaster } from "sonner";

interface SuperAdminLayoutClientProps {
  children: React.ReactNode;
  user: any;
  currentTenantName: string | null;
}

export function SuperAdminLayoutClient({ children, user, currentTenantName }: SuperAdminLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {user && (
        <SuperAdminSidebar
          user={user}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {user && (
          <SuperAdminHeader
            user={user}
            onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        )}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}