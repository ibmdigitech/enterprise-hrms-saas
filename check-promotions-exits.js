const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const promotions = await prisma.promotionRecord.findMany({ take: 5 });
    console.log('Promotions:', promotions.length);
  } catch(e) { console.log('PromotionRecord error:', e.message); }
  try {
    const exits = await prisma.exitCase.findMany({ take: 5 });
    console.log('ExitCases:', exits.length);
  } catch(e) { console.log('ExitCase error:', e.message); }
  try {
    const employees = await prisma.employee.findMany({ take: 5 });
    console.log('Employees:', employees.length);
    employees.forEach(e => console.log(' -', e.email, e.employeeCode, e.lifecycle));
  } catch(e) { console.log('Employee error:', e.message); }
}

main().finally(() => prisma.$disconnect());