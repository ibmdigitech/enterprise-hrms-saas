const { PrismaClient } = require('../prisma/generated/client');
const p = new PrismaClient();

async function main() {
    const users = await p.user.findMany({
        select: { email: true, role: true, name: true, password: true },
        orderBy: { email: 'asc' }
    });
    console.log('\n=== DATABASE USERS ===');
    users.forEach(u => {
        console.log(`  ${(u.email || '').padEnd(35)} | ${(u.role || '').padEnd(12)} | ${u.password ? 'HAS_PASSWORD' : 'NO_PASSWORD'} | ${u.name || ''}`);
    });
    console.log(`\nTotal: ${users.length} users`);
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => p.$disconnect());

