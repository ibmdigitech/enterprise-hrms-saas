const { PrismaClient } = require('../prisma/generated/client');
const p = new PrismaClient();

async function main() {
    // Show current company config values
    const configs = await p.serviceConfig.findMany({
        where: { module: 'COMPANY' },
        select: { key: true, value: true, label: true }
    });
    console.log('\n=== CURRENT COMPANY CONFIG ===');
    configs.forEach(c => console.log(`  ${c.key.padEnd(20)} = "${c.value}"`));
    console.log('');
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => p.$disconnect());

