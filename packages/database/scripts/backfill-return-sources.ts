import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.returnRequest.findMany({
    where: { sourceType: null },
    include: {
      order: {
        include: {
          tab: {
            include: { table: true },
          },
        },
      },
    },
  });

  console.log(`Found ${pending.length} return requests without sourceType`);

  for (const r of pending) {
    let sourceType: 'COMANDA' | 'MESA' | null = null;
    let sourceId: string | null = null;

    const desc = r.description || '';
    const mComanda = desc.match(/^Comanda:\s*([^\s\(]+)/i);
    const mMesa = desc.match(/^Mesa:\s*([^\s\(]+)/i);

    if (mComanda) {
      sourceType = 'COMANDA';
      sourceId = mComanda[1];
    } else if (mMesa) {
      sourceType = 'MESA';
      sourceId = mMesa[1];
    } else if (r.order?.tab?.table?.number) {
      sourceType = 'MESA';
      sourceId = String(r.order.tab.table.number);
    } else if (r.order?.tab?.id) {
      sourceType = 'COMANDA';
      sourceId = r.order.tab.id;
    }

    if (sourceType) {
      console.log(`Updating ${r.id} -> ${sourceType}:${sourceId}`);
      await prisma.returnRequest.update({ where: { id: r.id }, data: { sourceType, sourceId } });
    } else {
      console.log(`No source for ${r.id} — skipping`);
    }
  }

  console.log('Backfill complete');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
