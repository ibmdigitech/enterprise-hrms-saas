/**
 * Multi-tenant Scoped Prisma Client Factory.
 *
 * Automatically injects `tenantId` into read and write operations for tenant-scoped
 * models, preventing cross-tenant data leaks and IDOR vulnerabilities.
 */

import prisma from "../prisma";
import { getTenantDatabaseClient } from "./database-pool";

export const TENANT_SCOPED_MODELS = [
    // Core HR & Identity
    "Employee",
    "Attendance",
    "LeaveRequest",
    "SalaryRecord",
    "EmployeePromotion",
    "RoleRequest",
    // Organization & Structure
    "Company",
    "Location",
    "Department",
    "TenantMembership",
    // Billing & Subscriptions
    "TenantSubscription",
    "SubscriptionInvoice",
    "PaymentTransaction",
    "CompanyModule",
    // Training & Certifications
    "TrainingCourse",
    "TrainingSession",
    "TrainingEnrollment",
    "TrainingCertificate",
    "TrainingCertificateTemplate",
    "TrainingAssessment",
    "TrainingSkill",
    "EmployeeTrainingSkill",
    "TrainingCategory",
    // Support & Ops
    "SupportTicket",
    "Integration",
    "BackgroundJob",
    "IntegrationHealth",
] as const;

export type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];

/**
 * Returns a Prisma client instance with query middleware that enforces the active tenant context.
 * If a custom tenantDatabaseUrl is provided, it binds to that tenant's dedicated database.
 */
export function getScopedPrisma(tenantId: string, tenantDatabaseUrl?: string | null) {
    if (!tenantId) {
        throw new Error("Scoped Prisma requested without a valid tenantId.");
    }

    const baseClient = tenantDatabaseUrl ? getTenantDatabaseClient(tenantDatabaseUrl) : prisma;

    return baseClient.$extends({
        name: `tenant-scope-${tenantId}`,
        query: {
            $allModels: {
                async findMany({ model, args, query }: any) {
                    if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
                        args.where = { ...(args.where || {}), tenantId };
                    }
                    return query(args);
                },
                async findFirst({ model, args, query }: any) {
                    if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
                        args.where = { ...(args.where || {}), tenantId };
                    }
                    return query(args);
                },
                async count({ model, args, query }: any) {
                    if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
                        args.where = { ...(args.where || {}), tenantId };
                    }
                    return query(args);
                },
                async create({ model, args, query }: any) {
                    if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
                        args.data = { ...(args.data || {}), tenantId };
                    }
                    return query(args);
                },
                async update({ model, args, query }: any) {
                    if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
                        args.where = { ...(args.where || {}), tenantId };
                    }
                    return query(args);
                },
                async delete({ model, args, query }: any) {
                    if (TENANT_SCOPED_MODELS.includes(model as TenantScopedModel)) {
                        args.where = { ...(args.where || {}), tenantId };
                    }
                    return query(args);
                },
            },
        },
    });
}
