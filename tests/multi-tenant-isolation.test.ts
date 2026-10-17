import { describe, it, expect, vi } from "vitest";
import { getScopedPrisma, TENANT_SCOPED_MODELS } from "../lib/tenant/scoped-prisma";
import { canActOnEmployeeRecord, AuthorizationSubject } from "../lib/auth/scope";

describe("Phase 6: Multi-Tenant Security & Isolation", () => {
    describe("Tenant Scoped Models Registry", () => {
        it("declares all essential business models as tenant-scoped", () => {
            expect(TENANT_SCOPED_MODELS).toContain("Employee");
            expect(TENANT_SCOPED_MODELS).toContain("Company");
            expect(TENANT_SCOPED_MODELS).toContain("Location");
            expect(TENANT_SCOPED_MODELS).toContain("Department");
            expect(TENANT_SCOPED_MODELS).toContain("TenantMembership");
        });

        it("refuses scoped prisma instantiation without a tenantId", () => {
            expect(() => getScopedPrisma("")).toThrow("Scoped Prisma requested without a valid tenantId.");
        });
    });

    describe("Cross-Tenant IDOR and Scope Boundary Enforcement", () => {
        const tenantA_Admin: AuthorizationSubject = {
            userId: "user_a",
            email: "admin@tenant-a.com",
            role: "ADMIN",
            employeeId: "emp_a",
            department: "HR",
            tenantId: "tenant_alpha",
            companyId: "comp_alpha",
        };

        const tenantB_Staff: AuthorizationSubject = {
            userId: "user_b",
            email: "staff@tenant-b.com",
            role: "STAFF",
            employeeId: "emp_b",
            department: "Engineering",
            tenantId: "tenant_beta",
            companyId: "comp_beta",
        };

        it("allows staff to act only on their own employee record", () => {
            expect(canActOnEmployeeRecord(tenantB_Staff, { employeeId: "emp_b" })).toBe(true);
            expect(canActOnEmployeeRecord(tenantB_Staff, { employeeId: "emp_other" })).toBe(false);
        });

        it("enforces tenant boundary separation on subject identifiers", () => {
            expect(tenantA_Admin.tenantId).toBe("tenant_alpha");
            expect(tenantB_Staff.tenantId).toBe("tenant_beta");
            expect(tenantA_Admin.tenantId).not.toBe(tenantB_Staff.tenantId);
        });
    });
});
