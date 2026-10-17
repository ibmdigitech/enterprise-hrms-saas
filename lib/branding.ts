// Centralized branding configuration for Enterprise SaaS HRMS
// Provides fallback defaults and dynamic per-tenant branding resolvers

import prisma from "@/lib/prisma";

export const DEFAULT_BRANDING = {
  companyName: "Enterprise HRMS",
  companyFullName: "Enterprise HRMS SaaS LLC",
  systemName: "Enterprise HRMS SaaS",
  systemTagline: "Multi-Tenant Enterprise HR Management System",
  logoPath: "/assets/logo.svg",
  logoAlt: "Enterprise HRMS Logo",
  website: "https://hrms-saas.com",
  email: "support@hrms-saas.com",
  phone: "+971 4 123 4567",
  address: "Dubai, UAE",
  primaryColor: "#1e40af",
  accentColor: "#0284c7",
  copyright: `© ${new Date().getFullYear()} Enterprise HRMS SaaS | UAE`,
} as const;

export const BRANDING = DEFAULT_BRANDING;
export type Branding = typeof DEFAULT_BRANDING;

/**
 * Resolves dynamic tenant branding with graceful fallback to defaults.
 */
export async function getTenantBranding(tenantId?: string | null): Promise<Branding> {
  if (!tenantId) {
    return DEFAULT_BRANDING;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        legalName: true,
        logoUrl: true,
        primaryColor: true,
        accentColor: true,
        contactEmail: true,
        contactPhone: true,
      },
    });

    if (!tenant) return DEFAULT_BRANDING;

    return {
      companyName: tenant.name || DEFAULT_BRANDING.companyName,
      companyFullName: tenant.legalName || tenant.name || DEFAULT_BRANDING.companyFullName,
      systemName: `${tenant.name} HRMS`,
      systemTagline: DEFAULT_BRANDING.systemTagline,
      logoPath: tenant.logoUrl || DEFAULT_BRANDING.logoPath,
      logoAlt: `${tenant.name} Logo`,
      website: DEFAULT_BRANDING.website,
      email: tenant.contactEmail || DEFAULT_BRANDING.email,
      phone: tenant.contactPhone || DEFAULT_BRANDING.phone,
      address: DEFAULT_BRANDING.address,
      primaryColor: tenant.primaryColor || DEFAULT_BRANDING.primaryColor,
      accentColor: tenant.accentColor || DEFAULT_BRANDING.accentColor,
      copyright: `© ${new Date().getFullYear()} ${tenant.name} | Enterprise HRMS`,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

