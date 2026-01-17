import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar garçons
  const waiter1 = await prisma.waiter.create({
    data: {
      name: 'João Silva',
      active: true,
    },
  });

  const waiter2 = await prisma.waiter.create({
    data: {
      name: 'Maria Santos',
      active: true,
    },
  });

  console.log('✅ Garçons criados');

  // Criar mesas
  const tables = await Promise.all([
    prisma.table.create({
      data: {
        number: 1,
        location: 'Área externa',
        capacity: 4,
        waiterId: waiter1.id,
      },
    }),
    prisma.table.create({
      data: {
        number: 2,
        location: 'Salão principal',
        capacity: 2,
      },
    }),
    prisma.table.create({
      data: {
        number: 3,
        location: 'Salão principal',
        capacity: 6,
        waiterId: waiter2.id,
      },
    }),
    prisma.table.create({
      data: {
        number: 4,
        location: 'Varanda',
        capacity: 4,
      },
    }),
  ]);

  console.log('✅ Mesas criadas');

  // Criar itens do cardápio
  const menuItems = await Promise.all([
    // Entradas
    prisma.menuItem.create({
      data: {
        name: 'Bruschetta',
        description: 'Pão italiano com tomate, manjericão e azeite',
        price: 18.9,
        category: 'APPETIZER',
        available: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Tábua de Queijos',
        description: 'Seleção de queijos artesanais com geleia',
        price: 35.0,
        category: 'APPETIZER',
        available: true,
      },
    }),

    // Pratos principais
    prisma.menuItem.create({
      data: {
        name: 'Filé à Parmegiana',
        description: 'Filé grelhado com molho de tomate e queijo gratinado',
        price: 42.9,
        category: 'MAIN_COURSE',
        available: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Risoto de Cogumelos',
        description: 'Risoto cremoso com mix de cogumelos frescos',
        price: 38.5,
        category: 'MAIN_COURSE',
        available: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Salmão Grelhado',
        description: 'Salmão grelhado com legumes e molho de ervas',
        price: 48.9,
        category: 'MAIN_COURSE',
        available: true,
      },
    }),

    // Acompanhamentos
    prisma.menuItem.create({
      data: {
        name: 'Batata Frita',
        description: 'Porção de batatas fritas crocantes',
        price: 15.0,
        category: 'SIDE_DISH',
        available: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Arroz à Grega',
        description: 'Arroz branco com legumes salteados',
        price: 12.0,
        category: 'SIDE_DISH',
        available: true,
      },
    }),

    // Sobremesas
    prisma.menuItem.create({
      data: {
        name: 'Petit Gateau',
        description: 'Bolo de chocolate quente com sorvete',
        price: 22.0,
        category: 'DESSERT',
        available: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Cheesecake',
        description: 'Torta de cream cheese com calda de frutas vermelhas',
        price: 18.5,
        category: 'DESSERT',
        available: true,
      },
    }),

    // Bebidas
    prisma.menuItem.create({
      data: {
        name: 'Suco Natural',
        description: 'Laranja, limão ou morango',
        price: 8.0,
        category: 'BEVERAGE',
        available: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Refrigerante',
        description: 'Lata 350ml',
        price: 6.0,
        category: 'BEVERAGE',
        available: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Água Mineral',
        description: 'Com ou sem gás - 500ml',
        price: 4.5,
        category: 'BEVERAGE',
        available: true,
      },
    }),

    // Bebidas Alcoólicas
    prisma.menuItem.create({
      data: {
        name: 'Cerveja Artesanal',
        description: 'Long neck 355ml - IPA ou Pilsen',
        price: 12.0,
        category: 'ALCOHOLIC_BEVERAGE',
        available: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Caipirinha',
        description: 'Clássica de limão',
        price: 16.0,
        category: 'ALCOHOLIC_BEVERAGE',
        available: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Taça de Vinho',
        description: 'Tinto ou Branco - 150ml',
        price: 18.0,
        category: 'ALCOHOLIC_BEVERAGE',
        available: true,
      },
    }),
  ]);

  console.log('✅ Itens do cardápio criados');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log(`📊 Resumo:`);
  console.log(`   - ${2} garçons`);
  console.log(`   - ${tables.length} mesas`);
  console.log(`   - ${menuItems.length} itens no cardápio`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro ao executar seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
