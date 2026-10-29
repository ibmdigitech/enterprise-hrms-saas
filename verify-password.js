const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "superadmin@hrms.local" } });
  if (user) {
    const valid = await bcrypt.compare("SuperAdmin@123", user.password);
    console.log("User found:", user.email);
    console.log("Password valid:", valid);
  } else {
    console.log("User not found");
  }
}
main().finally(() => prisma.$disconnect());