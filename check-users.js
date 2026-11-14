const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@company.com' } });
  console.log('Admin user:', admin);
  
  if (admin) {
    // Test password
    const valid = await bcrypt.compare('password123', admin.password);
    console.log('Password "password123" valid:', valid);
    
    // Also test with SuperAdmin@123
    const valid2 = await bcrypt.compare('SuperAdmin@123', admin.password);
    console.log('Password "SuperAdmin@123" valid:', valid2);
  }
  
  // Check all users
  const users = await prisma.user.findMany({ select: { email: true, role: true, password: true } });
  console.log('\nAll users:');
  users.forEach(u => console.log(`  ${u.email} (${u.role}) - password hash: ${u.password ? u.password.substring(0, 20) + '...' : 'NULL'}`));
}

main().finally(() => prisma.$disconnect());