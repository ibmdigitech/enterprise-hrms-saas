"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

/**
 * Resolves active tenant context for the caller and verifies admin permissions.
 */
async function assertTenantAdmin(targetTenantId?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Authentication required.");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            memberships: {
                where: { status: "ACTIVE" },
            },
            employee: true,
        },
    });

    if (!user) throw new Error("User record not found.");

    // Platform SUPER_ADMIN has global authority
    if (user.role === "SUPER_ADMIN") {
        const resolvedTenantId = targetTenantId || user.employee?.tenantId || user.memberships[0]?.tenantId;
        if (!resolvedTenantId) throw new Error("Tenant context could not be determined.");
        return { userId: user.id, tenantId: resolvedTenantId, isSuperAdmin: true };
    }

    // Tenant admin check
    const membership = user.memberships.find(
        (m) => (!targetTenantId || m.tenantId === targetTenantId) && (m.role === "ADMIN" || m.role === "HR")
    );

    if (!membership && user.role !== "ADMIN" && user.role !== "HR") {
        throw new Error("Unauthorized: requires Organization Admin or HR privileges.");
    }

    const tenantId = targetTenantId || membership?.tenantId || user.employee?.tenantId;
    if (!tenantId) throw new Error("No active tenant context found.");

    return { userId: user.id, tenantId, isSuperAdmin: false };
}

// ─── COMPANY OPERATIONS ────────────────────────────────────────────────────────

export async function getTenantCompanies(tenantIdInput?: string) {
    const { tenantId } = await assertTenantAdmin(tenantIdInput);

    return prisma.company.findMany({
        where: { tenantId },
        include: {
            _count: {
                select: { locations: true, departments: true, employees: true },
            },
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
}

export async function createCompanyAction(input: {
    tenantId?: string;
    name: string;
    tradeLicenseNumber?: string;
    taxId?: string;
    currency?: string;
    isDefault?: boolean;
}) {
    const { tenantId } = await assertTenantAdmin(input.tenantId);

    // Check plan limits
    const [subscription, currentCompanies] = await Promise.all([
        prisma.tenantSubscription.findUnique({ where: { tenantId } }),
        prisma.company.count({ where: { tenantId } }),
    ]);

    const maxCompanies = subscription?.maxCompanies || 1;
    if (currentCompanies >= maxCompanies) {
        throw new Error(
            `Company limit reached (${currentCompanies}/${maxCompanies}). Upgrade your subscription plan to create additional corporate subsidiaries.`
        );
    }

    // If marked default, unset existing default
    if (input.isDefault) {
        await prisma.company.updateMany({
            where: { tenantId, isDefault: true },
            data: { isDefault: false },
        });
    }

    const company = await prisma.company.create({
        data: {
            tenantId,
            name: input.name.trim(),
            tradeLicenseNumber: input.tradeLicenseNumber?.trim() || null,
            taxId: input.taxId?.trim() || null,
            currency: input.currency?.toUpperCase() || "AED",
            isDefault: input.isDefault || currentCompanies === 0,
        },
    });

    revalidatePath("/company/organization");
    revalidatePath("/settings");
    return { success: true, company };
}

export async function updateCompanyAction(
    companyId: string,
    input: {
        name?: string;
        tradeLicenseNumber?: string;
        taxId?: string;
        currency?: string;
        isDefault?: boolean;
    }
) {
    const { tenantId } = await assertTenantAdmin();

    const existing = await prisma.company.findUnique({
        where: { id: companyId },
    });
    if (!existing || existing.tenantId !== tenantId) {
        throw new Error("Company not found or access denied.");
    }

    if (input.isDefault) {
        await prisma.company.updateMany({
            where: { tenantId, isDefault: true, id: { not: companyId } },
            data: { isDefault: false },
        });
    }

    const updated = await prisma.company.update({
        where: { id: companyId },
        data: {
            name: input.name?.trim(),
            tradeLicenseNumber: input.tradeLicenseNumber?.trim(),
            taxId: input.taxId?.trim(),
            currency: input.currency?.toUpperCase(),
            isDefault: input.isDefault,
        },
    });

    revalidatePath("/company/organization");
    revalidatePath("/settings");
    return { success: true, company: updated };
}

export async function deleteCompanyAction(companyId: string) {
    const { tenantId } = await assertTenantAdmin();

    const existing = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
            _count: { select: { employees: true, locations: true } },
        },
    });

    if (!existing || existing.tenantId !== tenantId) {
        throw new Error("Company not found or access denied.");
    }

    if (existing.isDefault) {
        throw new Error("Cannot delete the primary default company of an organization.");
    }

    if (existing._count.employees > 0) {
        throw new Error(
            `Cannot delete company: ${existing._count.employees} employees are currently assigned to this entity.`
        );
    }

    await prisma.company.delete({ where: { id: companyId } });

    revalidatePath("/company/organization");
    revalidatePath("/settings");
    return { success: true };
}

// ─── LOCATION OPERATIONS ───────────────────────────────────────────────────────

export async function getTenantLocations(companyId?: string) {
    const { tenantId } = await assertTenantAdmin();

    return prisma.location.findMany({
        where: {
            tenantId,
            ...(companyId ? { companyId } : {}),
        },
        include: {
            company: { select: { id: true, name: true } },
            _count: { select: { departments: true, employees: true } },
        },
        orderBy: { name: "asc" },
    });
}

export async function createLocationAction(input: {
    companyId: string;
    name: string;
    code?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
}) {
    const { tenantId } = await assertTenantAdmin();

    // Verify company belongs to this tenant
    const company = await prisma.company.findUnique({
        where: { id: input.companyId },
    });
    if (!company || company.tenantId !== tenantId) {
        throw new Error("Invalid subsidiary company selected.");
    }

    // Check location quota
    const [subscription, currentLocations] = await Promise.all([
        prisma.tenantSubscription.findUnique({ where: { tenantId } }),
        prisma.location.count({ where: { tenantId } }),
    ]);

    const maxLocations = subscription?.maxLocations || 2;
    if (currentLocations >= maxLocations) {
        throw new Error(
            `Location limit reached (${currentLocations}/${maxLocations}). Upgrade your subscription plan to add more branches.`
        );
    }

    const location = await prisma.location.create({
        data: {
            tenantId,
            companyId: input.companyId,
            name: input.name.trim(),
            code: input.code?.trim() || null,
            address: input.address?.trim() || null,
            city: input.city?.trim() || null,
            state: input.state?.trim() || null,
            country: input.country?.toUpperCase() || "AE",
            timezone: input.timezone || "Asia/Dubai",
            isActive: true,
        },
    });

    revalidatePath("/company/organization");
    return { success: true, location };
}

export async function updateLocationAction(
    locationId: string,
    input: {
        name?: string;
        code?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        timezone?: string;
        isActive?: boolean;
    }
) {
    const { tenantId } = await assertTenantAdmin();

    const existing = await prisma.location.findUnique({
        where: { id: locationId },
    });
    if (!existing || existing.tenantId !== tenantId) {
        throw new Error("Location not found or access denied.");
    }

    const updated = await prisma.location.update({
        where: { id: locationId },
        data: {
            name: input.name?.trim(),
            code: input.code?.trim(),
            address: input.address?.trim(),
            city: input.city?.trim(),
            state: input.state?.trim(),
            country: input.country?.toUpperCase(),
            timezone: input.timezone,
            isActive: input.isActive,
        },
    });

    revalidatePath("/company/organization");
    return { success: true, location: updated };
}

export async function deleteLocationAction(locationId: string) {
    const { tenantId } = await assertTenantAdmin();

    const existing = await prisma.location.findUnique({
        where: { id: locationId },
        include: { _count: { select: { employees: true } } },
    });

    if (!existing || existing.tenantId !== tenantId) {
        throw new Error("Location not found or access denied.");
    }

    if (existing._count.employees > 0) {
        throw new Error(`Cannot delete branch: ${existing._count.employees} employees are currently placed here.`);
    }

    await prisma.location.delete({ where: { id: locationId } });

    revalidatePath("/company/organization");
    return { success: true };
}

// ─── DEPARTMENT OPERATIONS ─────────────────────────────────────────────────────

export async function getTenantDepartments(companyId?: string) {
    const { tenantId } = await assertTenantAdmin();

    return prisma.department.findMany({
        where: {
            tenantId,
            ...(companyId ? { companyId } : {}),
        },
        include: {
            company: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
            parent: { select: { id: true, name: true } },
            _count: { select: { employees: true, children: true } },
        },
        orderBy: { name: "asc" },
    });
}

export async function createDepartmentAction(input: {
    companyId: string;
    locationId?: string;
    parentId?: string;
    name: string;
    code?: string;
}) {
    const { tenantId } = await assertTenantAdmin();

    // Verify company belongs to this tenant
    const company = await prisma.company.findUnique({
        where: { id: input.companyId },
    });
    if (!company || company.tenantId !== tenantId) {
        throw new Error("Invalid subsidiary company selected.");
    }

    if (input.locationId) {
        const loc = await prisma.location.findUnique({ where: { id: input.locationId } });
        if (!loc || loc.tenantId !== tenantId) throw new Error("Invalid branch location selected.");
    }

    const department = await prisma.department.create({
        data: {
            tenantId,
            companyId: input.companyId,
            locationId: input.locationId || null,
            parentId: input.parentId || null,
            name: input.name.trim(),
            code: input.code?.trim() || null,
        },
    });

    revalidatePath("/company/organization");
    return { success: true, department };
}

export async function deleteDepartmentAction(departmentId: string) {
    const { tenantId } = await assertTenantAdmin();

    const existing = await prisma.department.findUnique({
        where: { id: departmentId },
        include: { _count: { select: { employees: true, children: true } } },
    });

    if (!existing || existing.tenantId !== tenantId) {
        throw new Error("Department not found or access denied.");
    }

    if (existing._count.employees > 0) {
        throw new Error(`Cannot delete department: ${existing._count.employees} employees are assigned here.`);
    }

    if (existing._count.children > 0) {
        throw new Error(`Cannot delete department: it has ${existing._count.children} sub-departments.`);
    }

    await prisma.department.delete({ where: { id: departmentId } });

    revalidatePath("/company/organization");
    return { success: true };
}

// ─── FULL ORGANIZATION HIERARCHY TREE ──────────────────────────────────────────

export async function getOrganizationHierarchyData(tenantIdInput?: string) {
    const { tenantId } = await assertTenantAdmin(tenantIdInput);

    const [tenant, companies, locations, departments, employeeCount] = await Promise.all([
        prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscription: true },
        }),
        prisma.company.findMany({
            where: { tenantId },
            include: {
                _count: { select: { locations: true, departments: true, employees: true } },
            },
            orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        }),
        prisma.location.findMany({
            where: { tenantId },
            include: {
                company: { select: { id: true, name: true } },
                _count: { select: { departments: true, employees: true } },
            },
            orderBy: { name: "asc" },
        }),
        prisma.department.findMany({
            where: { tenantId },
            include: {
                company: { select: { id: true, name: true } },
                location: { select: { id: true, name: true } },
                parent: { select: { id: true, name: true } },
                _count: { select: { employees: true } },
            },
            orderBy: { name: "asc" },
        }),
        prisma.employee.count({ where: { tenantId } }),
    ]);

    if (!tenant) throw new Error("Tenant not found.");

    return {
        tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            currency: tenant.currency || "AED",
            status: tenant.status,
            planTier: tenant.subscription?.planTier || "TRIAL",
            quotas: {
                maxEmployees: tenant.subscription?.maxEmployees || 50,
                maxCompanies: tenant.subscription?.maxCompanies || 1,
                maxLocations: tenant.subscription?.maxLocations || 2,
            },
        },
        companies,
        locations,
        departments,
        totalEmployees: employeeCount,
    };
}
