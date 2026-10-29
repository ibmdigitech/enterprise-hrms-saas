require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ 
  datasources: { db: { url: process.env.DATABASE_URL } } 
});

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Success:', result);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();