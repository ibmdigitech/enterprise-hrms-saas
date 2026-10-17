/**
 * Legacy Data Migration & Seeding Script for SaaS Multi-Tenant Transition.
 *
 * This script ensures zero downtime and backward compatibility:
 * 1. Checks if a Default Primary Tenant exists; if not, provisions one.
 * 2. Checks if a Default Company exists for the primary tenant; if not, provisions it.
 * 3. Associates all existing orphaned Employees, Attendance, Leaves, and Salary records
 *    with the default tenant and company.
 */

import prisma from "../lib/prisma";

async function main() {
    console.log("Starting SaaS Multi-Tenant Migration & Backfill...");

    // 1. Create or ensure Default Primary Tenant
    let defaultTenant = await prisma.tenant.findFirst({
        where: { slug: "primary" },
    });

    if (!defaultTenant) {
        console.log("Provisioning Default Primary Tenant...");
        defaultTenant = await prisma.tenant.create({
            data: {
                name: "Primary Enterprise Group",
                slug: "primary",
                legalName: "Primary Enterprise LLC",
                status: "ACTIVE",
                timezone: "Asia/Dubai",
                currency: "AED",
                primaryColor: "#1e40af",
                accentColor: "#0284c7",
                subscription: {
                    create: {
                        planTier: "ENTERPRISE",
                        maxEmployees: 1000,
                        maxCompanies: 10,
                        maxLocations: 25,
                        hasPayroll: true,
                        hasCompliance: true,
                        hasRecruitment: true,
                        hasCustomTheme: true,
                        hasApiAccess: true,
                    },
                },
            },
        });
        console.log(`Default Tenant created with ID: ${defaultTenant.id}`);
    } else {
        console.log(`Default Tenant exists (ID: ${defaultTenant.id})`);
    }

    // 2. Create or ensure Default Company under Primary Tenant
    let defaultCompany = await prisma.company.findFirst({
        where: { tenantId: defaultTenant.id, isDefault: true },
    });

    if (!defaultCompany) {
        console.log("Provisioning Default Company...");
        defaultCompany = await prisma.company.create({
            data: {
                tenantId: defaultTenant.id,
                name: "Primary Corporation LLC",
                tradeLicenseNumber: "TL-DEFAULT-001",
                taxId: "VAT-DEFAULT-001",
                currency: "AED",
                isDefault: true,
            },
        });
        console.log(`Default Company created with ID: ${defaultCompany.id}`);
    }

    // 3. Backfill Employees without tenantId
    const employeeBackfill = await prisma.employee.updateMany({
        where: { tenantId: null },
        data: {
            tenantId: defaultTenant.id,
            companyId: defaultCompany.id,
        },
    });
    console.log(`Backfilled ${employeeBackfill.count} employee records with tenant & company scope.`);

    // 4. Backfill Attendance records without tenantId
    const attendanceBackfill = await prisma.attendance.updateMany({
        where: { tenantId: null },
        data: { tenantId: defaultTenant.id },
    });
    console.log(`Backfilled ${attendanceBackfill.count} attendance records.`);

    // 5. Backfill Leave Requests without tenantId
    const leaveBackfill = await prisma.leaveRequest.updateMany({
        where: { tenantId: null },
        data: { tenantId: defaultTenant.id },
    });
    console.log(`Backfilled ${leaveBackfill.count} leave requests.`);

    // 6. Backfill Salary Records without tenantId
    const salaryBackfill = await prisma.salaryRecord.updateMany({
        where: { tenantId: null },
        data: { tenantId: defaultTenant.id },
    });
    console.log(`Backfilled ${salaryBackfill.count} salary records.`);

    // 7. Ensure TenantMembership exists for all existing Users
    const usersWithoutMembership = await prisma.user.findMany({
        where: {
            memberships: { none: { tenantId: defaultTenant.id } },
        },
        select: { id: true, role: true },
    });

    if (usersWithoutMembership.length > 0) {
        console.log(`Creating Tenant Memberships for ${usersWithoutMembership.length} users...`);
        for (const user of usersWithoutMembership) {
            await prisma.tenantMembership.create({
                data: {
                    tenantId: defaultTenant.id,
                    userId: user.id,
                    role: user.role,
                    status: "ACTIVE",
                },
            });
        }
    }

    console.log("SaaS Multi-Tenant Migration & Backfill Completed Successfully! 🚀");
}

main()
    .catch((e) => {
        console.error("Migration failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
