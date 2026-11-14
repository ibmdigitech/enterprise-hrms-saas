const { PrismaClient } = require('../prisma/generated/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.MONGODB_URI
    }
  }
});


async function main() {
    console.log('Seeding standalone...');
    const rawPassword = 'password123';
    const password = await bcrypt.hash(rawPassword, 10);

    try {
        // --- ADMIN USER ---
        let admin = await prisma.user.findUnique({ where: { email: 'admin@company.com' } });
        if (!admin) {
            admin = await prisma.user.create({
                data: {
                    email: 'admin@company.com',
                    password: password,
                    role: 'ADMIN',
                    name: 'Admin User',
                }
            });
        } else {
            // Password is deliberately NOT reset on an existing account.
            // Re-running the seed must never silently revert a password the
            // user has since changed (P1.1 / SEC-027).
            admin = await prisma.user.update({
                where: { email: 'admin@company.com' },
                data: { name: 'Admin User' }
            });
        }

        let adminEmp = await prisma.employee.findUnique({ where: { userId: admin.id } });
        if (!adminEmp) {
            adminEmp = await prisma.employee.create({
                data: {
                    userId: admin.id,
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@company.com',
                    rollNumber: 'ADM-001',
                    designation: 'System Administrator',
                    department: 'IT',
                    joiningDate: new Date(),
                }
            });
        }
        console.log('Admin seeded:', admin.email);

        // --- MANAGER USER ---
        let manager = await prisma.user.findUnique({ where: { email: 'manager@company.com' } });
        if (!manager) {
            manager = await prisma.user.create({
                data: {
                    email: 'manager@company.com',
                    password: password,
                    role: 'MANAGER',
                    name: 'Manager User',
                }
            });
        } else {
            // Password is deliberately NOT reset on an existing account.
            // Re-running the seed must never silently revert a password the
            // user has since changed (P1.1 / SEC-027).
            manager = await prisma.user.update({
                where: { email: 'manager@company.com' },
                data: {}
            });
        }

        let managerEmp = await prisma.employee.findUnique({ where: { userId: manager.id } });
        if (!managerEmp) {
            managerEmp = await prisma.employee.create({
                data: {
                    userId: manager.id,
                    firstName: 'Manager',
                    lastName: 'User',
                    email: 'manager@company.com',
                    rollNumber: 'MGR-001',
                    designation: 'Operations Manager',
                    department: 'Operations',
                    joiningDate: new Date(),
                }
            });
        }
        console.log('Manager seeded:', manager.email);

        // --- STAFF USER ---
        let staff = await prisma.user.findUnique({ where: { email: 'staff@company.com' } });
        if (!staff) {
            staff = await prisma.user.create({
                data: {
                    email: 'staff@company.com',
                    password: password,
                    role: 'STAFF',
                    name: 'Staff User',
                }
            });
        } else {
            // Password is deliberately NOT reset on an existing account.
            // Re-running the seed must never silently revert a password the
            // user has since changed (P1.1 / SEC-027).
            staff = await prisma.user.update({
                where: { email: 'staff@company.com' },
                data: {}
            });
        }

        let staffEmp = await prisma.employee.findUnique({ where: { userId: staff.id } });
        if (!staffEmp) {
            staffEmp = await prisma.employee.create({
                data: {
                    userId: staff.id,
                    firstName: 'Staff',
                    lastName: 'User',
                    email: 'staff@company.com',
                    rollNumber: 'STF-001',
                    designation: 'Software Developer',
                    department: 'Engineering',
                    joiningDate: new Date(),
                }
            });
        }
        console.log('Staff seeded:', staff.email);

        const employees = [
            { user: admin, emp: adminEmp },
            { user: manager, emp: managerEmp },
            { user: staff, emp: staffEmp }
        ];

        console.log('Seeding Attendance records...');
        for (const item of employees) {
            const employee = item.emp;
            
            // Check if attendance already exists to prevent duplication
            const existingAttendance = await prisma.attendance.findFirst({
                where: { employeeId: employee.id }
            });

            if (!existingAttendance) {
                const now = new Date();
                for (let i = 0; i < 7; i++) {
                    const date = new Date();
                    date.setDate(now.getDate() - i);
                    await prisma.attendance.create({
                        data: {
                            employeeId: employee.id,
                            date: date,
                            checkIn: new Date(date.setHours(9, 0, 0)),
                            checkOut: new Date(date.setHours(18, 0, 0)),
                            status: i % 7 === 0 ? "ABSENT" : "PRESENT",
                        }
                    });
                }
            }
        }

        console.log('Seeding Service Types...');
        const serviceTypes = [
            { name: 'Reimbursement', description: 'Office and travel expenses', requiresAmount: true, requiresDates: false, requiresDocument: true },
            { name: 'Overtime', description: 'Additional working hours', requiresAmount: false, requiresDates: true },
            { name: 'Medical Payment', description: 'Hospital and medical bills', requiresAmount: true, requiresDates: false },
            { name: 'Out of Emirates', description: 'Travel outside UAE', requiresAmount: false, requiresDates: true },
            { name: 'EID Apply', description: 'Emirates ID application', requiresAmount: false, requiresDates: false },
            { name: 'Visit Visa', description: 'Visit visa requests', requiresAmount: false, requiresDates: false },
            { name: 'Miscellaneous', description: 'Other general requests', requiresAmount: false, requiresDates: false },
        ];

        for (const type of serviceTypes) {
            // Model is `ServiceCategory` in prisma/schema.prisma (ERROR-006).
            // The previous `prisma.staffServiceType.findUnique(...)` referenced
            // a model that does not exist, so seeding threw a TypeError here and
            // never reached the ServiceConfig block below.
            const existingType = await prisma.serviceCategory.findUnique({
                where: { name: type.name },
            });
            if (!existingType) {
                await prisma.serviceCategory.create({
                    data: {
                        name: type.name,
                        description: type.description,
                        requiresAmount: type.requiresAmount,
                        requiresDates: type.requiresDates,
                    },
                });
            } else {
                // Idempotent: keep the descriptive fields in sync on re-run.
                await prisma.serviceCategory.update({
                    where: { name: type.name },
                    data: {
                        description: type.description,
                        requiresAmount: type.requiresAmount,
                        requiresDates: type.requiresDates,
                    },
                });
            }
        }

        console.log('Seeding Service Configurations...');
        const serviceConfigs = [
            // Payroll
            { module: 'payroll', key: 'payroll_cycle', label: 'Payroll Cycle', type: 'select', value: 'Monthly' },
            { module: 'payroll', key: 'basic_salary_percentage', label: 'Basic Salary %', type: 'number', value: '50' },
            { module: 'payroll', key: 'overtime_rate_per_hour', label: 'Overtime Rate (Hour)', type: 'number', value: '1.5' },
            { module: 'payroll', key: 'late_penalty_amount', label: 'Late Penalty Amount', type: 'number', value: '50' },
            { module: 'payroll', key: 'auto_generate_payroll', label: 'Auto Generate Payroll', type: 'boolean', value: 'false' },
            { module: 'payroll', key: 'WPS_enabled', label: 'WPS Enabled', type: 'boolean', value: 'true' },

            // Attendance
            { module: 'attendance', key: 'working_hours_per_day', label: 'Working Hours/Day', type: 'number', value: '8' },
            { module: 'attendance', key: 'grace_period_minutes', label: 'Grace Period (Min)', type: 'number', value: '15' },
            { module: 'attendance', key: 'late_mark_threshold', label: 'Late Mark Threshold', type: 'number', value: '3' },
            { module: 'attendance', key: 'overtime_enabled', label: 'Overtime Enabled', type: 'boolean', value: 'true' },

            // Leave
            { module: 'leave', key: 'annual_leave_days', label: 'Annual Leave Days', type: 'number', value: '30' },
            { module: 'leave', key: 'sick_leave_days', label: 'Sick Leave Days', type: 'number', value: '15' },
            { module: 'leave', key: 'leave_auto_approval_days', label: 'Auto-Approval Days', type: 'number', value: '3' },
            { module: 'leave', key: 'carry_forward_enabled', label: 'Carry Forward', type: 'boolean', value: 'true' },

            // Visa
            { module: 'visa', key: 'expiry_reminder_days', label: 'Expiry Reminder Days', type: 'text', value: '90,60,30,14,7' },
            { module: 'visa', key: 'auto_flag_expired', label: 'Auto Flag Expired', type: 'boolean', value: 'true' },

            // Letters
            { module: 'letters', key: 'approval_required_types', label: 'Approval Required Types', type: 'text', value: 'OFFER,APPOINTMENT,RELIEVING,NOC,SALARY_CERTIFICATE' },

            // Notifications
            { module: 'notifications', key: 'email_notifications_enabled', label: 'Email Notifications', type: 'boolean', value: 'true' },
            { module: 'notifications', key: 'admin_alerts_enabled', label: 'Admin Alerts', type: 'boolean', value: 'true' },

            // Company (used by letter generation)
            { module: 'COMPANY', key: 'name', label: 'Company Name', type: 'text', value: 'MultiSaaS HRMS' },
            { module: 'COMPANY', key: 'logo', label: 'Company Logo', type: 'text', value: '' },
            { module: 'COMPANY', key: 'address', label: 'Company Address', type: 'text', value: 'Dubai, UAE' },
            { module: 'COMPANY', key: 'phone', label: 'Company Phone', type: 'text', value: '+971 4 123 4567' },
            { module: 'COMPANY', key: 'email', label: 'Company Email', type: 'text', value: 'hr@multisaas-hrms.com' },
            { module: 'COMPANY', key: 'website', label: 'Company Website', type: 'text', value: 'https://multisaas-hrms.com' },
            { module: 'COMPANY', key: 'signature', label: 'Signature', type: 'text', value: '' },
            { module: 'COMPANY', key: 'letterhead', label: 'Letterhead', type: 'text', value: '' },
        ];

        for (const config of serviceConfigs) {
            const existingConfig = await prisma.serviceConfig.findUnique({
                where: { module_key: { module: config.module, key: config.key } }
            });
            if (!existingConfig) {
                await prisma.serviceConfig.create({ data: config });
            } else {
                await prisma.serviceConfig.update({
                    where: { module_key: { module: config.module, key: config.key } },
                    data: { value: config.value }
                });
            }
        }

        console.log('Seeding Complete!');

    // Seed Subscription Plans
    console.log('Seeding Subscription Plans...');
    const subscriptionPlans = [
        {
            name: 'FREE',
            displayName: 'Free',
            description: 'Basic HR features for small teams',
            priceMonthly: 0,
            priceYearly: 0,
            currency: 'AED',
            features: {
                employees: true,
                attendance: true,
                leave: true,
                payroll: false,
                visa: false,
                letters: false,
                staffServices: false,
                requests: true,
                notifications: true,
                travel: false,
                performance: false,
                recruitment: false,
                companyDocuments: true,
                auditLog: false,
                backup: false,
                apiAccess: false,
                sso: false,
                customBranding: false,
                maxEmployees: 10,
                maxStorageGB: 1,
                ai: {
                    enabled: false,
                    provider: 'openai',
                    model: 'gpt-4o-mini',
                    features: {
                        smartSummaries: false,
                        autoLetterDrafting: false,
                        leavePolicyAssistant: false,
                        payrollAnomalyDetection: false,
                        employeeInsights: false,
                        recruitmentScreening: false,
                        attendancePatternAnalysis: false,
                        complianceAdvisor: false
                    },
                    limits: {
                        monthlyTokens: 0,
                        monthlyRequests: 0
                    }
                }
            },
            isActive: true,
            isDefault: true,
            sortOrder: 0
        },
        {
            name: 'STARTER',
            displayName: 'Starter',
            description: 'Core HR features for growing teams',
            priceMonthly: 199,
            priceYearly: 1990,
            currency: 'AED',
            features: {
                employees: true,
                attendance: true,
                leave: true,
                payroll: true,
                visa: true,
                letters: true,
                staffServices: true,
                requests: true,
                notifications: true,
                travel: true,
                performance: false,
                recruitment: true,
                companyDocuments: true,
                auditLog: false,
                backup: true,
                apiAccess: false,
                sso: false,
                customBranding: false,
                maxEmployees: 50,
                maxStorageGB: 5,
                ai: {
                    enabled: true,
                    provider: 'openai',
                    model: 'gpt-4o-mini',
                    features: {
                        smartSummaries: true,
                        autoLetterDrafting: true,
                        leavePolicyAssistant: true,
                        payrollAnomalyDetection: false,
                        employeeInsights: true,
                        recruitmentScreening: false,
                        attendancePatternAnalysis: false,
                        complianceAdvisor: false
                    },
                    limits: {
                        monthlyTokens: 50000,
                        monthlyRequests: 500
                    }
                }
            },
            isActive: true,
            isDefault: false,
            sortOrder: 1
        },
        {
            name: 'PROFESSIONAL',
            displayName: 'Professional',
            description: 'Advanced HR suite with AI assistance',
            priceMonthly: 499,
            priceYearly: 4990,
            currency: 'AED',
            features: {
                employees: true,
                attendance: true,
                leave: true,
                payroll: true,
                visa: true,
                letters: true,
                staffServices: true,
                requests: true,
                notifications: true,
                travel: true,
                performance: true,
                recruitment: true,
                companyDocuments: true,
                auditLog: true,
                backup: true,
                apiAccess: true,
                sso: true,
                customBranding: true,
                maxEmployees: 200,
                maxStorageGB: 25,
                ai: {
                    enabled: true,
                    provider: 'openai',
                    model: 'gpt-4o',
                    features: {
                        smartSummaries: true,
                        autoLetterDrafting: true,
                        leavePolicyAssistant: true,
                        payrollAnomalyDetection: true,
                        employeeInsights: true,
                        recruitmentScreening: true,
                        attendancePatternAnalysis: true,
                        complianceAdvisor: true
                    },
                    limits: {
                        monthlyTokens: 200000,
                        monthlyRequests: 2000
                    }
                }
            },
            isActive: true,
            isDefault: false,
            sortOrder: 2
        },
        {
            name: 'ENTERPRISE',
            displayName: 'Enterprise',
            description: 'Full platform with unlimited AI and custom features',
            priceMonthly: 1499,
            priceYearly: 14990,
            currency: 'AED',
            features: {
                employees: true,
                attendance: true,
                leave: true,
                payroll: true,
                visa: true,
                letters: true,
                staffServices: true,
                requests: true,
                notifications: true,
                travel: true,
                performance: true,
                recruitment: true,
                companyDocuments: true,
                auditLog: true,
                backup: true,
                apiAccess: true,
                sso: true,
                customBranding: true,
                maxEmployees: null,
                maxStorageGB: null,
                ai: {
                    enabled: true,
                    provider: 'openai',
                    model: 'gpt-4o',
                    features: {
                        smartSummaries: true,
                        autoLetterDrafting: true,
                        leavePolicyAssistant: true,
                        payrollAnomalyDetection: true,
                        employeeInsights: true,
                        recruitmentScreening: true,
                        attendancePatternAnalysis: true,
                        complianceAdvisor: true
                    },
                    limits: {
                        monthlyTokens: 1000000,
                        monthlyRequests: 10000
                    }
                }
            },
            isActive: true,
            isDefault: false,
            sortOrder: 3
        }
    ];

    for (const plan of subscriptionPlans) {
        const existingPlan = await prisma.subscriptionPlan.findUnique({
            where: { name: plan.name }
        });
        if (!existingPlan) {
            await prisma.subscriptionPlan.create({ data: plan });
            console.log(`Created plan: ${plan.name}`);
        } else {
            await prisma.subscriptionPlan.update({
                where: { name: plan.name },
                data: plan
            });
            console.log(`Updated plan: ${plan.name}`);
        }
    }

    // Create default subscription for the company
    const freePlan = await prisma.subscriptionPlan.findUnique({ where: { name: 'FREE' } });
    if (freePlan) {
        const existingSub = await prisma.companySubscription.findFirst({
            where: { status: { in: ['ACTIVE', 'TRIAL'] } }
        });
        if (!existingSub) {
            const now = new Date();
            const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            await prisma.companySubscription.create({
                data: {
                    planId: freePlan.id,
                    status: 'ACTIVE',
                    billingCycle: 'MONTHLY',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    provider: 'MANUAL',
                    employeesCount: 3,
                    storageUsedMB: 0,
                    apiCallsThisMonth: 0
                }
            });
            console.log('Created default FREE subscription');
        }
    }

console.log('Seeding Complete!');

    // Seed Platform Super Admin
    console.log('Seeding Platform Super Admin...');
    let superAdmin = await prisma.platformUser.findUnique({ where: { email: 'superadmin@hrms.local' } });
    if (!superAdmin) {
        superAdmin = await prisma.platformUser.create({
            data: {
                email: 'superadmin@hrms.local',
                passwordHash: password,
                name: 'Super Admin',
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
            }
        });
        console.log('Platform Super Admin seeded:', superAdmin.email);
    } else {
        console.log('Platform Super Admin already exists:', superAdmin.email);
    }

    console.log('Seeding Complete!');

} catch (e) {
        console.error('Seeding failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
