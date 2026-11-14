const { PrismaClient } = require('./prisma/generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://hr_admin:postgres@127.0.0.1:5434/hr_system' } }
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@company.com' },
    select: { id: true, email: true, password: true, securityFlag: { select: { mustChangePassword: true } } }
  });
  console.log('User found:', !!user);
  console.log('Has password:', !!user?.password);
  console.log('mustChangePassword:', user?.securityFlag?.mustChangePassword);
  
  // Test bcrypt against the seeded password
  if (user?.password) {
    const testPassword = 'GUA78VsZrcemZOJ3d4L7uQ';
    const matched = await bcrypt.compare(testPassword, user.password);
    console.log('Password matches:', matched);
  }
  
  await prisma.$disconnect();
}
main().catch(e => console.error(e));
