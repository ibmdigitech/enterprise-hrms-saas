const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "superadmin@hrms.local" } });
  if (user) {
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!password) {
      console.error("SUPER_ADMIN_PASSWORD environment variable is required");
      process.exit(1);
    }
    const valid = await bcrypt.compare(password, user.password);
    console.log("User found:", user.email);
    console.log("Password valid:", valid);
  } else {
    console.log("User not found");
  }
}
main().finally(() => prisma.$disconnect());
