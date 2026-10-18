// Centralized branding configuration for Enterprise HR Portal
// Provides fallback defaults and dynamic per-tenant branding resolvers

import prisma from "@/lib/prisma";

export interface Branding {
  companyName: string;
  companyFullName: string;
  systemName: string;
  systemTagline: string;
  logoPath: string;
  logoAlt: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  primaryColor: string;
  accentColor: string;
  copyright: string;
}

export const DEFAULT_BRANDING: Branding = {
  companyName: "Enterprise HRMS",
  companyFullName: "Enterprise HR Solutions LLC",
  systemName: "Enterprise HRMS",
  systemTagline: "Enterprise HR Management Platform",
  logoPath: "/assets/logo.svg",
  logoAlt: "HRMS Logo",
  website: "https://portal.enterprisehrms.com",
  email: "support@enterprisehrms.com",
  phone: "+971 4 123 4567",
  address: "Dubai, UAE",
  primaryColor: "#1e40af",
  accentColor: "#0284c7",
  copyright: `\u00a9 ${new Date().getFullYear()} Enterprise HRMS | UAE`,
};

export const BRANDING = DEFAULT_BRANDING;

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
      systemName: `${tenant.name} HR Portal`,
      systemTagline: "Employee & Workforce Management",
      logoPath: tenant.logoUrl || DEFAULT_BRANDING.logoPath,
      logoAlt: `${tenant.name} Logo`,
      website: DEFAULT_BRANDING.website,
      email: tenant.contactEmail || DEFAULT_BRANDING.email,
      phone: tenant.contactPhone || DEFAULT_BRANDING.phone,
      address: DEFAULT_BRANDING.address,
      primaryColor: tenant.primaryColor || DEFAULT_BRANDING.primaryColor,
      accentColor: tenant.accentColor || DEFAULT_BRANDING.accentColor,
      copyright: `© ${new Date().getFullYear()} ${tenant.name} | All Rights Reserved`,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

