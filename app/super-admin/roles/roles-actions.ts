"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { KNOWN_ROLES } from "@/lib/auth/roles";

export async function getRolesOverviewAction() {
  await requireSuperAdmin("platform.roles.view");

  // Count users per role
  const userCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: { _all: true },
  });

  const countMap: Record<string, number> = {};
  for (const item of userCounts) {
    countMap[item.role] = item._count._all;
  }

  // Predefined role metadata and privileges
  const rolesData = [
    {
      role: "SUPER_ADMIN",
      name: "Super Administrator",
      description: "Root platform operator with unrestricted control over all tenants, infrastructure, and billing.",
      level: "Platform Global",
      scope: "ALL_TENANTS",
      permissions: [
        "Create & suspend tenants",
        "Manage platform subscriptions & plans",
        "Direct database provisioning & isolation",
        "Impersonate & support tenants",
        "Audit trail & system health",
      ],
      userCount: countMap["SUPER_ADMIN"] || 0,
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    {
      role: "COMPANY_ADMIN",
      name: "Company Administrator",
      description: "Full management authority inside a specific tenant organization and its sub-entities.",
      level: "Tenant Root",
      scope: "SINGLE_TENANT",
      permissions: [
        "Company profile & locations setup",
        "Department hierarchy configuration",
        "Tenant employee directory management",
        "Self-service billing & subscription upgrades",
        "Invite & manage company users",
      ],
      userCount: countMap["COMPANY_ADMIN"] || 0,
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    {
      role: "ADMIN",
      name: "Organization Admin (Legacy)",
      description: "Organization administrator mapped to primary company administration.",
      level: "Tenant Administrative",
      scope: "SINGLE_TENANT",
      permissions: [
        "Manage all HR policies",
        "Departmental approvals",
        "Full staff directory edit access",
      ],
      userCount: countMap["ADMIN"] || 0,
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      role: "HR_MANAGER",
      name: "HR Manager",
      description: "Workforce operations, recruitment, on/offboarding, compliance, and letters.",
      level: "Tenant Operations",
      scope: "TENANT_DEPARTMENT",
      permissions: [
        "Recruitment & interview feedback",
        "Leave & attendance review & overrides",
        "UAE visa tracking & reminders",
        "Letter generation & certificate issuance",
        "Performance cycles execution",
      ],
      userCount: (countMap["HR_MANAGER"] || 0) + (countMap["HR"] || 0),
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      role: "FINANCE",
      name: "Finance Controller",
      description: "Payroll processing, salary structures, loans, and end-of-service settlements.",
      level: "Tenant Operations",
      scope: "TENANT_FINANCE",
      permissions: [
        "Payroll calculation runs & WPS exports",
        "Salary advance & loan approvals",
        "Final settlements approval",
        "Reimbursements review",
      ],
      userCount: countMap["FINANCE"] || 0,
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      role: "DEPARTMENT_MANAGER",
      name: "Department Manager / Team Lead",
      description: "Operational supervisor over direct reports and department approvals.",
      level: "Departmental",
      scope: "DEPARTMENT_TEAM",
      permissions: [
        "Direct report approvals (Leave, Travel)",
        "Attendance review for team",
        "Performance evaluations",
        "Requisition requests creation",
      ],
      userCount: (countMap["DEPARTMENT_MANAGER"] || 0) + (countMap["MANAGER"] || 0),
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      role: "EMPLOYEE",
      name: "Employee / Staff",
      description: "Standard workforce member with personal self-service portal access.",
      level: "Individual",
      scope: "SELF_ONLY",
      permissions: [
        "Clock in / out attendance",
        "Apply for leaves & travel",
        "View payslips & salary slips",
        "Request letters & document renewals",
        "Self-enroll in training sessions",
      ],
      userCount: (countMap["EMPLOYEE"] || 0) + (countMap["STAFF"] || 0),
      badgeColor: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    },
  ];

  return { roles: rolesData, totalUsers: await prisma.user.count() };
}

