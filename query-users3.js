const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres@localhost:5432/hr_system"
    }
  }
});
async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, password: true }
  });
  console.log(JSON.stringify(users, null, 2));
}
main().finally(() => prisma.$disconnect());