const { PrismaClient } = require('../prisma/generated/client');
const p = new PrismaClient();

async function main() {
    // Show tenants
    let tenants = [];
    try {
        tenants = await p.tenant.findMany({
            select: { id: true, name: true, slug: true, status: true }
        });
        console.log('\n=== TENANTS ===');
        tenants.forEach(t => console.log(`  ${t.id.slice(0,8)}... | ${(t.slug||'').padEnd(20)} | ${t.name} | ${t.status}`));
    } catch(e) {
        console.log('No tenant table:', e.message);
    }

    // Show ServiceConfig with key=name
    try {
        const configs = await p.serviceConfig.findMany({
            where: { key: 'name' },
            select: { key: true, value: true, module: true }
        });
        console.log('\n=== NAME CONFIGS IN serviceConfig ===');
        configs.forEach(c => console.log(`  module: ${(c.module||'').padEnd(15)} key: ${c.key} => "${c.value}"`));
    } catch(e) {
        console.log('ServiceConfig error:', e.message);
    }

    // Check if Tenant has a name field in companies table
    try {
        const companies = await p.company.findMany({
            select: { id: true, name: true }
        });
        console.log('\n=== COMPANIES ===');
        companies.forEach(c => console.log(`  ${c.id.slice(0,8)}... | ${c.name}`));
    } catch(e) {
        console.log('No company table:', e.message);
    }
    console.log('');
}

main().catch(e => console.error('FATAL:', e.message)).finally(() => p.$disconnect());
