"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

const DEFAULT_AI_SERVICES = [
  {
    key: "ai_hr_assistant",
    name: "AI HR & Policy Assistant",
    category: "PRODUCTIVITY",
    provider: "OPENAI",
    defaultModel: "gpt-4o",
    priceMonthly: 199,
    tokenAllowance: 500000,
    description: "Natural-language query assistant for UAE labor law, company policies, leave balance queries, and payslip explanations.",
  },
  {
    key: "ai_cv_parser",
    name: "AI Recruitment & CV Parser",
    category: "RECRUITMENT",
    provider: "OPENAI",
    defaultModel: "gpt-4o-mini",
    priceMonthly: 249,
    tokenAllowance: 1000000,
    description: "Automated resume parsing, candidate skill extraction, job description drafting, and panel interview questions.",
  },
  {
    key: "ai_doc_intelligence",
    name: "AI Document Intelligence & OCR",
    category: "DOCUMENT",
    provider: "GOOGLE",
    defaultModel: "gemini-1.5-flash",
    priceMonthly: 299,
    tokenAllowance: 1500000,
    description: "Automated OCR data extraction for Emirates ID, residency visas, passports, and expiration validation.",
  },
  {
    key: "ai_payroll_assistant",
    name: "AI Payroll & Anomaly Detector",
    category: "PAYROLL",
    provider: "OPENAI",
    defaultModel: "gpt-4o",
    priceMonthly: 199,
    tokenAllowance: 500000,
    description: "Payroll anomaly detection, gross-to-net variance analysis, and overtime trend explanations (Strictly read-only).",
  },
  {
    key: "ai_letter_generator",
    name: "AI Letter & Document Generator",
    category: "PRODUCTIVITY",
    provider: "OPENAI",
    defaultModel: "gpt-4o-mini",
    priceMonthly: 149,
    tokenAllowance: 500000,
    description: "AI-assisted drafting of customized employee letters, certificates, and bilingual English-Arabic document translation.",
  },
];

/**
 * Super Admin: Get all AI Services, provider credentials status, and usage totals.
 */
export async function getAiServicesOverviewAction() {
  await requireSuperAdmin("platform.settings.view");

  // Ensure default AI services are populated in database
  for (const s of DEFAULT_AI_SERVICES) {
    await prisma.aIModule.upsert({
      where: { key: s.key },
      update: {
        name: s.name,
        category: s.category,
        description: s.description,
        provider: s.provider,
        defaultModel: s.defaultModel,
      },
      create: {
        key: s.key,
        name: s.name,
        category: s.category,
        provider: s.provider,
        defaultModel: s.defaultModel,
        priceMonthly: s.priceMonthly,
        tokenAllowance: s.tokenAllowance,
        description: s.description,
        isPublished: true,
        isActive: true,
      },
    });
  }

  const [aiModules, totalTokensUsed, totalSpend, totalTenants] = await Promise.all([
    prisma.aIModule.findMany({
      orderBy: { category: "asc" },
      include: {
        _count: { select: { usageLogs: true } },
      },
    }),
    prisma.aIUsageLog.aggregate({
      _sum: { totalTokens: true, estimatedCostAed: true },
    }),
    prisma.aICompanyBudget.aggregate({
      _sum: { currentSpendAed: true, monthlyBudgetAed: true },
    }),
    prisma.tenant.count(),
  ]);

  return {
    aiModules,
    stats: {
      totalTokens: totalTokensUsed._sum.totalTokens || 0,
      totalCostAed: totalTokensUsed._sum.estimatedCostAed || 0,
      totalBudgetAed: totalSpend._sum.monthlyBudgetAed || 0,
      totalTenants,
    },
  };
}

/**
 * Super Admin: Update AI Module settings (provider, model, token allowances).
 */
export async function updateAiModuleAction(
  id: string,
  data: Partial<{
    provider: string;
    defaultModel: string;
    priceMonthly: number;
    tokenAllowance: number;
    isPublished: boolean;
    isActive: boolean;
  }>
) {
  await requireSuperAdmin("platform.settings.manage");

  await prisma.aIModule.update({
    where: { id },
    data,
  });

  revalidatePath("/super-admin/ai-services");
  return { success: true };
}

