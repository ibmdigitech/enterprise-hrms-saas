const { PrismaClient } = require('../prisma/generated/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

const KNOWN_DEFAULTS = ['password123', 'Password@123', 'Admin@123456', 'SuperAdmin@123'];

async function main() {
    const users = await p.user.findMany({
        select: { email: true, role: true, name: true, password: true },
        orderBy: { email: 'asc' }
    });

    console.log('\n=== PASSWORD AUDIT ===');
    for (const u of users) {
        if (!u.password) { console.log(`  ${u.email} — NO PASSWORD`); continue; }
        let found = null;
        for (const def of KNOWN_DEFAULTS) {
            if (await bcrypt.compare(def, u.password)) { found = def; break; }
        }
        const status = found ? `⚠  USING DEFAULT: "${found}"` : '✓  Custom password (not a known default)';
        console.log(`  ${(u.email || '').padEnd(35)} ${status}`);
    }
    console.log('');
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => p.$disconnect());

