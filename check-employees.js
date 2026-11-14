const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany();
  console.log('Employees:', employees.length);
  employees.forEach(e => console.log(' -', e.email, e.employeeCode, e.designation, e.department, e.joiningDate, e.lifecycle));
}

main().finally(() => prisma.$disconnect());