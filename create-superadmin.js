const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "superadmin@hrms.local";
  const password = "SuperAdmin@123";
  const name = "Super Admin";

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Super admin already exists:", existing);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Find or create tenant for platform admin
  let tenant = await prisma.tenant.findUnique({ where: { slug: "platform-admin" } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Platform Admin",
        slug: "platform-admin",
        status: "ACTIVE",
        currency: "AED",
        subscription: {
          create: {
            planTier: "ENTERPRISE",
            billingCycle: "ANNUAL",
            status: "ACTIVE",
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        },
      },
    });
  }

  // Create super admin user with employee and membership
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      employee: {
        create: {
          firstName: "Super",
          lastName: "Admin",
          email,
          designation: "Platform Administrator",
          department: "Platform",
          joiningDate: new Date(),
          tenantId: tenant.id,
          rollNumber: "SA-001",
        },
      },
      memberships: {
        create: {
          tenantId: tenant.id,
          role: "ADMIN",
          status: "ACTIVE",
        },
      },
    },
  });

  console.log("Super admin created successfully!");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Role:", user.role);
  console.log("Tenant:", tenant.name, "(" + tenant.slug + ")");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });