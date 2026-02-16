import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🔧 Gerando comandas fictícias para um garçom (João Silva)...');

  // Ensure waiter exists
  let waiter = await prisma.waiter.findFirst({ where: { name: 'João Silva' } });
  if (!waiter) {
    waiter = await prisma.waiter.create({ data: { name: 'João Silva', active: true } });
    console.log('  - Garçom criado:', waiter.id);
  } else {
    console.log('  - Garçom encontrado:', waiter.id);
  }

  const menuItems = await prisma.menuItem.findMany({ take: 10 });
  if (!menuItems.length) {
    throw new Error('Nenhum menu item encontrado. Rode o seed antes.');
  }

  const today = new Date();
  const createdTabs: any[] = [];

  // Create 50 paid tabs across the last 90 days
  for (let i = 0; i < 50; i++) {
    const daysAgo = randInt(0, 90);
    const createdAt = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000 + randInt(0, 8) * 60 * 60 * 1000);

    const ordersCount = randInt(1, 4);
    const ordersData: any[] = [];
    let total = 0;
    for (let o = 0; o < ordersCount; o++) {
      const menu = pick(menuItems);
      const qty = randInt(1, 3);
      const orderTotal = +(menu.price * qty).toFixed(2);
      total += orderTotal;

      const created = new Date(createdAt.getTime() + randInt(0, 45) * 60 * 1000);
      const sentToKitchenAt = new Date(created.getTime() + randInt(1, 10) * 60 * 1000);
      const startedPreparingAt = new Date(sentToKitchenAt.getTime() + randInt(1, 5) * 60 * 1000);
      const readyAt = new Date(startedPreparingAt.getTime() + randInt(5, 25) * 60 * 1000);
      const deliveredAt = new Date(readyAt.getTime() + randInt(1, 10) * 60 * 1000);

      ordersData.push({
        menuItemId: menu.id,
        quantity: qty,
        unitPrice: menu.price,
        totalPrice: orderTotal,
        status: 'DELIVERED',
        serviceChargeIncluded: true,
        sentToKitchenAt,
        startedPreparingAt,
        readyAt,
        deliveredAt,
        createdAt: created,
        updatedAt: deliveredAt,
      });
    }

    const paidAt = new Date(createdAt.getTime() + randInt(20, 180) * 60 * 1000);
    const paidAmount = +(total + total * 0.1).toFixed(2);

    const tab = await prisma.tab.create({
      data: {
        tableId: null,
        type: 'COUNTER',
        total: +total.toFixed(2),
        status: 'CLOSED',
        paymentMethod: pick(['CASH','CREDIT_CARD','DEBIT_CARD','PIX']),
        paidAmount,
        changeAmount: null,
        serviceChargeIncluded: true,
        serviceChargePaidSeparately: false,
        serviceChargeAmount: +(total * 0.1).toFixed(2),
        isUnifiedTab: false,
        unifiedTabPersonCount: 1,
        customerSeatedAt: new Date(createdAt.getTime() - randInt(1,10)*60*1000),
        requestedBillAt: new Date(paidAt.getTime() - randInt(1,15)*60*1000),
        paidAt,
        createdAt,
        updatedAt: paidAt,
        closedAt: new Date(createdAt.getTime() + randInt(20, 300) * 60 * 1000),
        orders: { create: ordersData },
        waiterHistory: {
          create: {
            waiterId: waiter.id,
            assignedAt: new Date(createdAt.getTime() - randInt(1,5) * 60 * 1000),
            removedAt: new Date(paidAt.getTime() + randInt(1,10) * 60 * 1000),
          },
        },
      },
    });

    createdTabs.push(tab);
  }

  console.log(`✅ Criadas ${createdTabs.length} comandas para ${waiter.name}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Erro ao gerar comandas:', e);
  await prisma.$disconnect();
  process.exit(1);
});
