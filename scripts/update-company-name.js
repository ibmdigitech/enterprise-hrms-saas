/**
 * Update all company/platform name references in the database to "MultiSaaS HRMS"
 */
const { PrismaClient } = require('../prisma/generated/client');
const p = new PrismaClient();

const NEW_NAME = 'MultiSaaS HRMS';
const NEW_SLUG = 'multisaas-hrms';
const NEW_EMAIL = 'admin@multisaas-hrms.com';
const NEW_WEBSITE = 'https://multisaas-hrms.com';

async function main() {
    console.log(`\nUpdating company name to: "${NEW_NAME}"\n`);

    // 1. Update ServiceConfig COMPANY name
    const updated = await p.serviceConfig.updateMany({
        where: { module: 'COMPANY', key: 'name' },
        data: { value: NEW_NAME }
    });
    console.log(`✓ serviceConfig[COMPANY/name]: updated ${updated.count} row(s)`);

    // Show all current COMPANY configs after update
    const configs = await p.serviceConfig.findMany({
        where: { module: 'COMPANY' },
        select: { key: true, value: true }
    });
    console.log('\n=== COMPANY CONFIG (after update) ===');
    configs.forEach(c => console.log(`  ${c.key.padEnd(20)} = "${c.value}"`));
    console.log('');
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => p.$disconnect());

