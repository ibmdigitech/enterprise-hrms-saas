const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Simple query OK:', result);
    
    // Test user query
    const users = await prisma.user.findMany({ take: 5 });
    console.log('User query OK, count:', users.length);
    
    // Test employee query
    const employees = await prisma.employee.findMany({ take: 5 });
    console.log('Employee query OK, count:', employees.length);
    
    // Test companySubscription query
    const subs = await prisma.companySubscription.findMany({ take: 5 });
    console.log('Subscription query OK, count:', subs.length);
    
    // Test subscriptionPlan query
    const plans = await prisma.subscriptionPlan.findMany({ take: 5 });
    console.log('Plan query OK, count:', plans.length);
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();