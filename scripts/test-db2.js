const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Connecting...');
    await prisma.$connect();
    console.log('Connected!');
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Users:', users);
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();