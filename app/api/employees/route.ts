import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { NOT_ARCHIVED } from '@/lib/employees/retention';
import { authorizePermission } from '@/lib/auth/guards';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { scopeTenantWhere } from '@/lib/auth/scope';

export async function GET(req: Request) {
    const authResult = await authorizePermission(PERMISSIONS.EMPLOYEES_VIEW);
    if (!authResult.ok) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const subject = authResult.subject;

    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId');

        const where: Record<string, unknown> = { ...NOT_ARCHIVED };

        // TENANT-ISOLATION: every employee query must be scoped by tenantId.
        // ADMIN/HR within a tenant see only that tenant's employees.
        // SUPER_ADMIN (ALL scope) sees everything unless a tenantId filter is explicitly provided.
        if (subject.tenantId) {
            Object.assign(where, scopeTenantWhere(subject, {}));
        } else if (tenantId) {
            // Explicit tenant filter for platform-scoped callers
            where['tenantId'] = tenantId;
        }

        const employees = await prisma.employee.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                designation: true,
                rollNumber: true,
                governmentId: true,
                joiningDate: true,
                tenantId: true,
            },
            orderBy: { firstName: 'asc' }
        });
        return NextResponse.json(employees);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}
