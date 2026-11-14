const { PrismaClient } = require('../prisma/generated/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
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

        // --- SUPER ADMIN (PlatformUser) ---
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