const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();
async function main() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log('Subscription plans:', plans);
  const user = await prisma.user.findUnique({ where: { email: 'admin@company.com' }});
  console.log('Admin user:', user ? 'Found' : 'Not found');
}
main().finally(() => prisma.$disconnect());