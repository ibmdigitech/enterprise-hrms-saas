"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export async function getModulesOverviewAction() {
  await requireSuperAdmin("platform.modules.view");

  const [subscriptions, totalTenants] = await Promise.all([
    prisma.tenantSubscription.findMany({
      select: {
        hasPayroll: true,
        hasCompliance: true,
        hasRecruitment: true,
        hasCustomTheme: true,
        hasApiAccess: true,
      },
    }),
    prisma.tenant.count(),
  ]);

  const counts = {
    payroll: subscriptions.filter((s) => s.hasPayroll).length,
    compliance: subscriptions.filter((s) => s.hasCompliance).length,
    recruitment: subscriptions.filter((s) => s.hasRecruitment).length,
    customTheme: subscriptions.filter((s) => s.hasCustomTheme).length,
    apiAccess: subscriptions.filter((s) => s.hasApiAccess).length,
  };

  const modules = [
    {
      id: "payroll",
      name: "Payroll & Wage Protection (WPS)",
      category: "Finance & Legal",
      description: "UAE labor compliant payroll, salary calculations, automated allowances, WPS SIF export file generation, and employee bank disbursals.",
      activeTenants: counts.payroll,
      totalTenants,
      status: "CORE",
    },
    {
      id: "compliance",
      name: "UAE Visa & Document Compliance",
      category: "Legal & Residency",
      description: "Automated tracking for Emirates ID, Residence Visa, Labor Cards, and medical insurance with threshold escalation reminders.",
      activeTenants: counts.compliance,
      totalTenants,
      status: "CORE",
    },
    {
      id: "recruitment",
      name: "ATS & Recruitment Pipeline",
      category: "Talent Acquisition",
      description: "Job requisition workflows, multi-stage candidate scoring, panel interview evaluations, and automated offer letter issuance.",
      activeTenants: counts.recruitment,
      totalTenants,
      status: "ADDON",
    },
    {
      id: "customTheme",
      name: "White-label & Dynamic Branding",
      category: "Customization",
      description: "Per-tenant visual customization: brand logos, dynamic hex colors, portal titles, and enterprise subdomain routing.",
      activeTenants: counts.customTheme,
      totalTenants,
      status: "ENTERPRISE",
    },
    {
      id: "apiAccess",
      name: "REST API & Webhooks Access",
      category: "Developer Platform",
      description: "Programmatic access to employee master data, attendance device webhooks, and third-party accounting ERP synchronization.",
      activeTenants: counts.apiAccess,
      totalTenants,
      status: "ENTERPRISE",
    },
  ];

  return { modules, totalTenants };
}

