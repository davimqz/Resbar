import { prisma } from '../src/lib/prisma.js';

async function main() {
  const since = new Date();
  since.setDate(since.getDate() - 2);

  const tabs = await prisma.tab.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { person: true, table: true },
  });

  console.log(`Found ${tabs.length} tabs since ${since.toISOString()}`);
  for (const t of tabs) {
    console.log('---');
    console.log(`id: ${t.id}`);
    console.log(`tableId: ${t.tableId} (tableStatus=${t.table?.status})`);
    console.log(`status: ${t.status}`);
    console.log(`total: ${t.total} paidAmount: ${t.paidAmount} paymentMethod: ${t.paymentMethod}`);
    console.log(`paidAt: ${t.paidAt} closedAt: ${t.closedAt} allUnified: ${t.isUnifiedTab}`);
    console.log(`createdAt: ${t.createdAt}`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
