require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function test() {
  try {
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