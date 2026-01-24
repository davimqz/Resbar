const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.count();
    const tables = await prisma.table.count();
    const tabs = await prisma.tab.count();
    const orders = await prisma.order.count();
    console.log({ users, tables, tabs, orders });
  } catch (err) {
    console.error('Error counting rows:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
