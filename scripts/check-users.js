const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: "admin" } },
                { role: { in: ["ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN"] } }
            ]
        },
        select: { id: true, email: true, role: true, password: true }
    });
    console.log("Admin users found:");
    for (const u of users) {
        console.log(`Email: ${u.email}, Role: ${u.role}, PasswordHash: ${u.password ? u.password.substring(0, 15) + '...' : 'NULL'}`);
    }

    // Also check PlatformUser table if it exists
    try {
        const platformUsers = await prisma.platformUser.findMany();
        console.log("Platform Users:", platformUsers.map(p => ({ email: p.email, role: p.role, hasHash: !!p.passwordHash })));
    } catch (e) {
        console.log("No PlatformUser or error:", e.message);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
