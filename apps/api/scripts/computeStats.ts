import { prisma } from '../src/lib/prisma.js';

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyRevenueTabs = await prisma.tab.findMany({ where: { status: 'CLOSED', closedAt: { gte: today } }, select: { total: true } });
  const dailyRevenue = dailyRevenueTabs.reduce((s, t) => s + t.total, 0);

  const orderCounts = await prisma.order.groupBy({ by: ['status'], _count: { status: true } });
  const ordersCount = {
    pending: orderCounts.find(o => o.status === 'PENDING')?._count.status || 0,
    preparing: orderCounts.find(o => o.status === 'PREPARING')?._count.status || 0,
    ready: orderCounts.find(o => o.status === 'READY')?._count.status || 0,
    delivered: orderCounts.find(o => o.status === 'DELIVERED')?._count.status || 0,
  };

  const tablesOccupied = await prisma.table.count({ where: { status: { in: ['OCCUPIED', 'PAID_PENDING_RELEASE'] } } });

  const counterTabs = await prisma.tab.count({ where: { type: 'COUNTER', createdAt: { gte: today } } });

  console.log('dailyRevenue:', dailyRevenue);
  console.log('ordersCount:', ordersCount);
  console.log('tablesOccupied:', tablesOccupied);
  console.log('counterTabsToday:', counterTabs);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
