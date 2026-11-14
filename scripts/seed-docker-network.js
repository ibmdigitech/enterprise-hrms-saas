const { PrismaClient } = require('../prisma/generated/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://hr_admin:postgres@127.0.0.1:5434/hr_system"
    }
  }
});

async function main() {
    console.log('Seeding from Docker network...');

    // --- Generate one-time random passwords for all admin accounts ---
    // These are output ONCE to the console and must be changed on first login.
    const generatedPasswords = {};
    function generateRandomPassword() {
        return crypto.randomBytes(16).toString('base64url');
    }

    try {
        // --- TENANT ---
        let tenant = await prisma.tenant.findFirst({ where: { slug: 'default-company' } });
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Default Company',
                    slug: 'default-company',
                    legalName: 'Default Company LLC',
                    customDomain: 'default-company.hrms.local',
                    status: 'ACTIVE',
                    logoUrl: '',
                    primaryColor: '#1e40af',
                    accentColor: '#0284c7',
                    timezone: 'America/New_York',
                    currency: 'USD',
                    locale: 'en',
                    contactEmail: 'admin@company.com',
                    contactPhone: '+1-555-0001',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }
        console.log('Tenant seeded:', tenant.name);

        // --- COMPANY ---
        let company = await prisma.company.findFirst({ where: { tenantId: tenant.id } });
        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: 'Default Company',
                    tenantId: tenant.id,
                    tradeLicenseNumber: 'REG-001',
                    taxId: 'TAX-001',
                    currency: 'USD',
                    logoUrl: '',
                    isDefault: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }
        console.log('Company seeded:', company.name);

        // --- LOCATION ---
        let location = await prisma.location.findFirst({ where: { companyId: company.id, name: 'Head Office' } });
        if (!location) {
            location = await prisma.location.create({
                data: {
                    name: 'Head Office',
                    code: 'HQ',
                    companyId: company.id,
                    tenantId: tenant.id,
                    address: '123 Business Ave',
                    city: 'Business City',
                    state: 'Business State',
                    country: 'USA',
                    timezone: 'America/New_York',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }
        console.log('Location seeded:', location.name);

        // --- DEPARTMENT ---
        let department = await prisma.department.findFirst({ where: { companyId: company.id, name: 'IT' } });
        if (!department) {
            department = await prisma.department.create({
                data: {
                    name: 'IT',
                    code: 'IT',
                    companyId: company.id,
                    tenantId: tenant.id,
                    locationId: location.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }
        console.log('Department seeded:', department.name);

        // --- OPERATIONS DEPARTMENT ---
        let opsDept = await prisma.department.findFirst({ where: { companyId: company.id, name: 'Operations' } });
        if (!opsDept) {
            opsDept = await prisma.department.create({
                data: {
                    name: 'Operations',
                    code: 'OPS',
                    companyId: company.id,
                    tenantId: tenant.id,
                    locationId: location.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }
        console.log('Department seeded:', opsDept.name);

        // --- ENGINEERING DEPARTMENT ---
        let engDept = await prisma.department.findFirst({ where: { companyId: company.id, name: 'Engineering' } });
        if (!engDept) {
            engDept = await prisma.department.create({
                data: {
                    name: 'Engineering',
                    code: 'ENG',
                    companyId: company.id,
                    tenantId: tenant.id,
                    locationId: location.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }
        console.log('Department seeded:', engDept.name);

        // --- SUBSCRIPTION PLAN ---
        let plan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'professional' } });
        if (!plan) {
            plan = await prisma.subscriptionPlan.create({
                data: {
                    name: 'Professional',
                    slug: 'professional',
                    displayName: 'Professional Plan',
                    description: 'Full featured HRMS for growing companies',
                    priceMonthly: 99.00,
                    priceAnnual: 999.00,
                    priceYearly: 999.00,
                    currency: 'USD',
                    features: {
                        payroll: true,
                        advancedReporting: true,
                        apiAccess: true,
                        customBranding: true,
                        prioritySupport: true,
                        multiLocation: true,
                        customWorkflows: true,
                        sso: false,
                        dedicatedSupport: false
                    },
                    maxEmployees: 100,
                    maxCompanies: 1,
                    maxLocations: 5,
                    hasPayroll: true,
                    hasCompliance: true,
                    hasRecruitment: true,
                    hasCustomTheme: true,
                    hasApiAccess: true,
                    isPopular: true,
                    isActive: true,
                    isDefault: false,
                    sortOrder: 2,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }
        console.log('Subscription Plan seeded:', plan.name);

        // --- TENANT SUBSCRIPTION ---
        let tenantSub = await prisma.tenantSubscription.findFirst({ where: { tenantId: tenant.id } });
        if (!tenantSub) {
            tenantSub = await prisma.tenantSubscription.create({
                data: {
                    tenantId: tenant.id,
                    planId: plan.id,
                    status: 'ACTIVE',
                    billingCycle: 'MONTHLY',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    maxEmployees: 100,
                    maxCompanies: 1,
                    maxLocations: 5,
                    hasPayroll: true,
                    hasCompliance: true,
                    hasRecruitment: true,
                    hasCustomTheme: true,
                    hasApiAccess: true,
                    planTier: 'PROFESSIONAL',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
        }
        console.log('Tenant Subscription seeded');

        // --- Helper: create or update a user with forced password change ---
        async function seedUser({ email, role, name }) {
            const rawPassword = generateRandomPassword();
            const passwordHash = await bcrypt.hash(rawPassword, 10);
            generatedPasswords[email] = rawPassword;

            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        password: passwordHash,
                        role,
                        name,
                    }
                });
                console.log('User created:', email, '(role:', role + ')');
            } else {
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        password: passwordHash,
                        role,
                        name,
                    }
                });
                console.log('User updated:', email, '(role:', role + ')');
            }

            // Force password change on first login
            await prisma.userSecurityFlag.upsert({
                where: { userId: user.id },
                update: {
                    mustChangePassword: true,
                    mustChangeReason: 'Seeded account — forced password change on first login',
                    updatedAt: new Date(),
                },
                create: {
                    userId: user.id,
                    mustChangePassword: true,
                    mustChangeReason: 'Seeded account — forced password change on first login',
                }
            });
            console.log('  → mustChangePassword set for:', email);

            return user;
        }

        // --- ADMIN USER ---
        const admin = await seedUser({
            email: 'admin@company.com',
            role: 'ADMIN',
            name: 'Admin User',
        });

        let adminEmp = await prisma.employee.findUnique({ where: { userId: admin.id } });
        if (!adminEmp) {
            adminEmp = await prisma.employee.create({
                data: {
                    user: { connect: { id: admin.id } },
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@company.com',
                    rollNumber: 'ADM-001',
                    designation: 'System Administrator',
                    department: 'IT',
                    joiningDate: new Date(),
                    employmentType: 'FULL_TIME',
                    currentStatus: 'PRE_JOINING',
                    lifecycle: 'PRE_JOINING',
                    isActive: false,
                    workLocation: 'Head Office',
                    tenant: { connect: { id: tenant.id } },
                    company: { connect: { id: company.id } },
                    location: { connect: { id: location.id } },
                    departmentRel: { connect: { id: department.id } },
                }
            });
        }
        console.log('Admin employee seeded:', admin.email);

        // --- MANAGER USER ---
        const manager = await seedUser({
            email: 'manager@company.com',
            role: 'MANAGER',
            name: 'Manager User',
        });

        let managerEmp = await prisma.employee.findUnique({ where: { userId: manager.id } });
        if (!managerEmp) {
            managerEmp = await prisma.employee.create({
                data: {
                    user: { connect: { id: manager.id } },
                    firstName: 'Manager',
                    lastName: 'User',
                    email: 'manager@company.com',
                    rollNumber: 'MGR-001',
                    designation: 'Operations Manager',
                    department: 'Operations',
                    joiningDate: new Date(),
                    employmentType: 'FULL_TIME',
                    currentStatus: 'PRE_JOINING',
                    lifecycle: 'PRE_JOINING',
                    isActive: false,
                    workLocation: 'Head Office',
                    tenant: { connect: { id: tenant.id } },
                    company: { connect: { id: company.id } },
                    location: { connect: { id: location.id } },
                    departmentRel: { connect: { id: opsDept.id } },
                }
            });
        }
        console.log('Manager employee seeded:', manager.email);

        // --- STAFF USER ---
        const staff = await seedUser({
            email: 'staff@company.com',
            role: 'STAFF',
            name: 'Staff User',
        });

        let staffEmp = await prisma.employee.findUnique({ where: { userId: staff.id } });
        if (!staffEmp) {
            staffEmp = await prisma.employee.create({
                data: {
                    user: { connect: { id: staff.id } },
                    firstName: 'Staff',
                    lastName: 'User',
                    email: 'staff@company.com',
                    rollNumber: 'STF-001',
                    designation: 'Software Developer',
                    department: 'Engineering',
                    joiningDate: new Date(),
                    employmentType: 'FULL_TIME',
                    currentStatus: 'PRE_JOINING',
                    lifecycle: 'PRE_JOINING',
                    isActive: false,
                    workLocation: 'Head Office',
                    tenant: { connect: { id: tenant.id } },
                    company: { connect: { id: company.id } },
                    location: { connect: { id: location.id } },
                    departmentRel: { connect: { id: engDept.id } },
                }
            });
        }
        console.log('Staff employee seeded:', staff.email);

        // --- TENANT MEMBERSHIPS ---
        let adminMembership = await prisma.tenantMembership.findFirst({ where: { userId: admin.id, tenantId: tenant.id } });
        if (!adminMembership) {
            await prisma.tenantMembership.create({
                data: {
                    userId: admin.id,
                    tenantId: tenant.id,
                    role: 'ADMIN',
                    status: 'ACTIVE',
                    joinedAt: new Date(),
                }
            });
        }
        console.log('Admin Tenant Membership created');

        let managerMembership = await prisma.tenantMembership.findFirst({ where: { userId: manager.id, tenantId: tenant.id } });
        if (!managerMembership) {
            await prisma.tenantMembership.create({
                data: {
                    userId: manager.id,
                    tenantId: tenant.id,
                    role: 'MANAGER',
                    status: 'ACTIVE',
                    joinedAt: new Date(),
                }
            });
        }
        console.log('Manager Tenant Membership created');

        let staffMembership = await prisma.tenantMembership.findFirst({ where: { userId: staff.id, tenantId: tenant.id } });
        if (!staffMembership) {
            await prisma.tenantMembership.create({
                data: {
                    userId: staff.id,
                    tenantId: tenant.id,
                    role: 'STAFF',
                    status: 'ACTIVE',
                    joinedAt: new Date(),
                }
            });
        }
        console.log('Staff Tenant Membership created');

        // --- SUPER ADMIN (User table for login) ---
        console.log('Seeding Super Admin user for login...');
        const superAdminRawPassword = generateRandomPassword();
        const superAdminPasswordHash = await bcrypt.hash(superAdminRawPassword, 10);
        generatedPasswords['superadmin@hrms.local'] = superAdminRawPassword;

        let superAdminUser = await prisma.user.findUnique({ where: { email: 'superadmin@hrms.local' } });
        if (!superAdminUser) {
            superAdminUser = await prisma.user.create({
                data: {
                    email: 'superadmin@hrms.local',
                    password: superAdminPasswordHash,
                    role: 'SUPER_ADMIN',
                    name: 'Super Admin',
                }
            });
            console.log('Super Admin user created:', superAdminUser.email);
        } else {
            superAdminUser = await prisma.user.update({
                where: { email: 'superadmin@hrms.local' },
                data: {
                    password: superAdminPasswordHash,
                    role: 'SUPER_ADMIN',
                    name: 'Super Admin',
                }
            });
            console.log('Super Admin user updated:', superAdminUser.email);
        }

        await prisma.userSecurityFlag.upsert({
            where: { userId: superAdminUser.id },
            update: {
                mustChangePassword: true,
                mustChangeReason: 'Seeded Super Admin account — forced password change on first login',
                updatedAt: new Date(),
            },
            create: {
                userId: superAdminUser.id,
                mustChangePassword: true,
                mustChangeReason: 'Seeded Super Admin account — forced password change on first login',
            }
        });
        console.log('  → mustChangePassword set for: superadmin@hrms.local');

        // --- SUPER ADMIN (PlatformUser) ---
        console.log('Seeding Platform Super Admin...');
        let platformSuperAdmin = await prisma.platformUser.findUnique({ where: { email: 'superadmin@hrms.local' } });
        if (!platformSuperAdmin) {
            platformSuperAdmin = await prisma.platformUser.create({
                data: {
                    email: 'superadmin@hrms.local',
                    passwordHash: superAdminPasswordHash,
                    name: 'Super Admin',
                    role: 'SUPER_ADMIN',
                    status: 'ACTIVE',
                }
            });
            console.log('Platform Super Admin seeded:', platformSuperAdmin.email);
        } else {
            console.log('Platform Super Admin already exists:', platformSuperAdmin.email);
        }

        // --- OUTPUT ONE-TIME PASSWORDS ---
        console.log('\n========================================');
        console.log('ONE-TIME ADMIN PASSWORDS (CHANGE ON FIRST LOGIN)');
        console.log('========================================');
        for (const [email, password] of Object.entries(generatedPasswords)) {
            console.log(`${email}: ${password}`);
        }
        console.log('========================================');
        console.log('Save these passwords securely. They are shown ONCE.');
        console.log('All accounts have mustChangePassword=true and must be changed on first login.');
        console.log('========================================\n');

        console.log('Seeding Complete!');

    } catch (e) {
        console.error('Seeding failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();