import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const mapping: Record<string, string> = {
  'Suco Natural': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba',
  Refrigerante: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e',
  'Água Mineral': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d',
  'Arroz à Grega': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
  Caipirinha: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a',
  'Taça de Vinho': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3',
  // Cheesecake and Risoto de Cogumelos removed from mapping (deleted from seed)
};

async function main() {
  console.log('Iniciando atualização de imageUrl...');

  for (const [name, url] of Object.entries(mapping)) {
    try {
      const res = await prisma.menuItem.updateMany({
        where: {
          name,
          OR: [{ imageUrl: null }, { imageUrl: '' }],
        },
        data: { imageUrl: url },
      });

      if (res.count > 0) {
        console.log(`Atualizado ${res.count} registro(s) para "${name}"`);
      } else {
        console.log(`Nenhuma atualização necessária para "${name}"`);
      }
    } catch (e) {
      console.error(`Erro atualizando "${name}":`, e);
    }
  }

  console.log('Atualização de imageUrl concluída.');
}

main()
  .catch((e) => {
    console.error('Erro no script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
