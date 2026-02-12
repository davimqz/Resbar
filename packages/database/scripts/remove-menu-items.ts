import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const names = ['Cheesecake', 'Risoto de Cogumelos'];
  // Find menu items by name
  const toRemove = await prisma.menuItem.findMany({ where: { name: { in: names } }, select: { id: true, name: true } });
  const ids = toRemove.map((m) => m.id);

  if (ids.length === 0) {
    console.log('No matching menu items found to remove.');
  } else {
    // Remove dependent orders first
    try {
      const delOrders = await prisma.order.deleteMany({ where: { menuItemId: { in: ids } } });
      console.log(`Deleted ${delOrders.count} order(s) referencing these menu items.`);
    } catch (e) {
      console.error('Error deleting orders referencing menu items:', e);
    }

    // Now remove the menu items
    try {
      const res = await prisma.menuItem.deleteMany({ where: { id: { in: ids } } });
      console.log(`Deleted ${res.count} menuItem record(s).`);
    } catch (e) {
      console.error('Error deleting menu items:', e);
    }
  }

  const remaining = await prisma.menuItem.findMany({ select: { id: true, name: true } });
  console.log('\nRemaining menu items:');
  remaining.forEach((r) => console.log('-', r.name));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
