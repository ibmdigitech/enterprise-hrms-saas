"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

const DEFAULT_MARKETPLACE_CATALOGUE = [
  // A. HR Core
  {
    key: "core_hr",
    name: "Core HR Management",
    category: "CORE",
    description: "Employee master directory, organizational units, departments, designations, and digital personnel files.",
    isCore: true,
    priceMonthly: 0,
    priceAnnual: 0,
    features: ["Employee Master", "Profile 360", "Org Structure", "Document Vault", "Access Control"],
  },
  // B. Workforce Management
  {
    key: "attendance_shifts",
    name: "Time, Attendance & Shifts",
    category: "WORKFORCE",
    description: "Shift scheduling, biometric clock-in/out integration, overtime tracking, and attendance analytics.",
    isCore: false,
    priceMonthly: 149,
    priceAnnual: 1490,
    features: ["Biometric Sync", "Shift Rotations", "Overtime Engine", "Lateness Penalties", "Attendance Logs"],
  },
  {
    key: "leave_management",
    name: "Leave & Absence Management",
    category: "WORKFORCE",
    description: "UAE labor law annual leave accruals, sick leave, compassionate leave, and multi-tier approval flows.",
    isCore: false,
    priceMonthly: 99,
    priceAnnual: 990,
    features: ["Accrual Runs", "Multi-tier Approvals", "Carry Forward Rules", "Balance Tracking"],
  },
  // C. Payroll & Finance
  {
    key: "payroll_wps",
    name: "Payroll Automation & UAE WPS",
    category: "PAYROLL",
    description: "Automated monthly salary calculation, bank allowances, deductions, WPS SIF file generator, and payslips.",
    isCore: false,
    priceMonthly: 249,
    priceAnnual: 2490,
    features: ["Salary Structure", "WPS SIF Export", "Batch Payslip PDF", "Direct Disbursal", "Final Settlement"],
  },
  {
    key: "loans_advances",
    name: "Employee Loans & Salary Advances",
    category: "PAYROLL",
    description: "Staff loan applications, disbursement tracking, and automated monthly payroll deductions.",
    isCore: false,
    priceMonthly: 79,
    priceAnnual: 790,
    features: ["Loan Workflow", "Installment Schedules", "Auto-Deduct", "Disbursement Records"],
  },
  // D. Employee Lifecycle
  {
    key: "recruitment_ats",
    name: "Recruitment & Applicant Tracking",
    category: "LIFECYCLE",
    description: "Job requisitions, candidate pipeline management, panel interview feedback, and offer letter generation.",
    isCore: false,
    priceMonthly: 199,
    priceAnnual: 1990,
    features: ["Candidate Scoring", "Interview Panels", "Offer Approvals", "Hiring Analytics"],
  },
  {
    key: "exit_management",
    name: "Resignation & Exit Clearance",
    category: "LIFECYCLE",
    description: "Resignation requests, asset recovery checklists, exit interviews, and UAE End-of-Service Gratuity calculations.",
    isCore: false,
    priceMonthly: 89,
    priceAnnual: 890,
    features: ["UAE Gratuity Calculator", "Asset Clearance", "Exit Interview", "Rehire Assessments"],
  },
  // E. Talent Management
  {
    key: "performance_kpis",
    name: "Performance Appraisals & KPIs",
    category: "TALENT",
    description: "360 performance reviews, objective tracking, managerial evaluations, and competency scoring.",
    isCore: false,
    priceMonthly: 169,
    priceAnnual: 1690,
    features: ["Performance Cycles", "Goal Tracking", "Manager Ratings", "Review Scenarios"],
  },
  {
    key: "training_certs",
    name: "Training & Certification",
    category: "TALENT",
    description: "Corporate course enrollments, attendance, skill matrices, and QR-verifiable certificate generation.",
    isCore: false,
    priceMonthly: 129,
    priceAnnual: 1290,
    features: ["Course Catalog", "Enrollments", "QR Certificates", "Skill Assessments"],
  },
  // F. UAE Compliance
  {
    key: "visa_compliance",
    name: "UAE Visa & Document Compliance",
    category: "COMPLIANCE",
    description: "Emirates ID, Residence Visa, labor cards, medical insurance tracking, and automated expiry alerts.",
    isCore: false,
    priceMonthly: 179,
    priceAnnual: 1790,
    features: ["Emirates ID Tracker", "Labor Card Expiry", "Renewal Workflow", "Compliance Scans"],
  },
  // G. Employee Services
  {
    key: "letter_system",
    name: "Official Letter Request Engine",
    category: "SERVICES",
    description: "Employee self-service letter requests, manager/HR approvals, company letterhead & stamp embedding, PDF generation.",
    isCore: false,
    priceMonthly: 119,
    priceAnnual: 1190,
    features: ["Salary Certificates", "NOC Letters", "Official Stamp & Seal", "Approval Workflows"],
  },
  {
    key: "support_desk",
    name: "Support Desk & SLA Ticketing",
    category: "SERVICES",
    description: "Multi-tenant helpdesk, customer inquiry submission, priority response SLAs, and reply messaging.",
    isCore: false,
    priceMonthly: 99,
    priceAnnual: 990,
    features: ["Deterministic SLAs", "Public & Private Notes", "Ticket Lifecycle", "Category Routing"],
  },
  // H. AI Add-on Services
  {
    key: "ai_hr_assistant",
    name: "AI HR & Policy Assistant",
    category: "AI",
    description: "Conversational assistant for labor laws, company policies, leave balance queries, and management guidance.",
    isCore: false,
    priceMonthly: 199,
    priceAnnual: 1990,
    features: ["Natural Language HR", "Policy Explanations", "Context-Aware Assistance", "Zero Data Leakage"],
  },
  {
    key: "ai_document_intelligence",
    name: "AI Document Intelligence & OCR",
    category: "AI",
    description: "Automated OCR extraction from Emirates ID, passports, and visas with expiration validation.",
    isCore: false,
    priceMonthly: 249,
    priceAnnual: 2490,
    features: ["Emirates ID OCR", "Passport Parser", "Auto-Extraction", "Verification Alerts"],
  },
];

/**
 * Super Admin: Get all modules in the marketplace, with active subscribers and revenue.
 */
export async function getMarketplaceModulesAction() {
  await requireSuperAdmin("platform.modules.view");

  // Ensure default catalog is populated in database
  for (const item of DEFAULT_MARKETPLACE_CATALOGUE) {
    await prisma.module.upsert({
      where: { key: item.key },
      update: {
        name: item.name,
        category: item.category,
        description: item.description,
        isCore: item.isCore,
      },
      create: {
        key: item.key,
        name: item.name,
        category: item.category,
        description: item.description,
        isCore: item.isCore,
        priceMonthly: item.priceMonthly,
        priceAnnual: item.priceAnnual,
        features: item.features,
        isPublished: true,
        isActive: true,
      },
    });
  }

  const [modules, companyModules, totalTenants] = await Promise.all([
    prisma.module.findMany({
      orderBy: [{ isCore: "desc" }, { category: "asc" }, { sortOrder: "asc" }],
      include: {
        _count: {
          select: { companyModules: true },
        },
      },
    }),
    prisma.companyModule.findMany({
      select: { moduleId: true, status: true },
    }),
    prisma.tenant.count(),
  ]);

  const result = modules.map((mod) => {
    const activeSubs = companyModules.filter((cm) => cm.moduleId === mod.id && (cm.status === "ENABLED" || cm.status === "TRIAL")).length;
    const estMonthlyRevenue = activeSubs * mod.priceMonthly;

    return {
      ...mod,
      activeSubscribers: mod.isCore ? totalTenants : activeSubs,
      totalTenants,
      estMonthlyRevenue,
    };
  });

  return { modules: result, totalTenants };
}

/**
 * Super Admin: Create a new module in the marketplace.
 */
export async function createMarketplaceModuleAction(data: {
  key: string;
  name: string;
  category: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  trialDays: number;
  features: string[];
  dependencies: string[];
  isCore?: boolean;
}) {
  await requireSuperAdmin("platform.modules.manage");

  const existing = await prisma.module.findUnique({ where: { key: data.key.toLowerCase().trim() } });
  if (existing) throw new Error(`A module with key '${data.key}' already exists.`);

  const mod = await prisma.module.create({
    data: {
      key: data.key.toLowerCase().trim(),
      name: data.name.trim(),
      category: data.category || "ENTERPRISE",
      description: data.description.trim(),
      priceMonthly: Number(data.priceMonthly) || 0,
      priceAnnual: Number(data.priceAnnual) || 0,
      trialDays: Number(data.trialDays) || 14,
      features: data.features || [],
      dependencies: data.dependencies || [],
      isCore: !!data.isCore,
      isPublished: true,
      isActive: true,
    },
  });

  revalidatePath("/super-admin/modules");
  return { success: true, module: mod };
}

/**
 * Super Admin: Update module pricing, details, and publish status.
 */
export async function updateMarketplaceModuleAction(
  moduleId: string,
  data: Partial<{
    name: string;
    description: string;
    category: string;
    priceMonthly: number;
    priceAnnual: number;
    trialDays: number;
    features: string[];
    dependencies: string[];
    isPublished: boolean;
    isActive: boolean;
  }>
) {
  await requireSuperAdmin("platform.modules.manage");

  await prisma.module.update({
    where: { id: moduleId },
    data,
  });

  revalidatePath("/super-admin/modules");
  return { success: true };
}

/**
 * Super Admin: Toggle module entitlement for a specific tenant company.
 */
export async function toggleTenantModuleAction(data: {
  tenantId: string;
  moduleId: string;
  status: "ENABLED" | "DISABLED" | "TRIAL";
  trialDays?: number;
}) {
  await requireSuperAdmin("platform.modules.manage");

  let expiresAt: Date | null = null;
  if (data.status === "TRIAL") {
    const days = data.trialDays || 14;
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  await prisma.companyModule.upsert({
    where: {
      tenantId_companyId_moduleId: {
        tenantId: data.tenantId,
        companyId: null as any,
        moduleId: data.moduleId,
      },
    },
    update: {
      status: data.status,
      expiresAt,
    },
    create: {
      tenantId: data.tenantId,
      moduleId: data.moduleId,
      status: data.status,
      expiresAt,
    },
  });

  revalidatePath("/super-admin/modules");
  revalidatePath("/settings/billing");
  return { success: true };
}
