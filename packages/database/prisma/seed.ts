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
        detailedDescription: 'Deliciosa entrada italiana com pão crocante, tomates frescos, manjericão e um fio de azeite extra virgem',
        price: 18.9,
        category: 'APPETIZER',
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f',
        allergens: ['GLUTEN'],
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Tábua de Queijos',
        description: 'Seleção de queijos artesanais com geleia',
        detailedDescription: 'Mix de queijos artesanais selecionados: brie, gorgonzola e gouda, acompanhados de geleias especiais e torradas',
        price: 35.0,
        category: 'APPETIZER',
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862',
        allergens: ['DAIRY', 'GLUTEN'],
      },
    }),

    // Pratos principais
    prisma.menuItem.create({
      data: {
        name: 'Filé à Parmegiana',
        description: 'Filé grelhado com molho de tomate e queijo gratinado',
        detailedDescription: 'Suculento filé mignon grelhado, coberto com molho de tomate caseiro e queijo mussarela gratinado, acompanha arroz e batatas',
        price: 42.9,
        category: 'MAIN_COURSE',
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976',
        allergens: ['DAIRY'],
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Risoto de Cogumelos',
        description: 'Risoto cremoso com mix de cogumelos frescos',
        detailedDescription: 'Arroz arbóreo preparado lentamente com caldo de legumes, mix de cogumelos frescos (shiitake, paris e shimeji), finalizado com parmesão e manteiga',
        price: 38.5,
        category: 'MAIN_COURSE',
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1476124369491-b79f25d6ff50',
        allergens: ['DAIRY'],
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Salmão Grelhado',
        description: 'Salmão grelhado com legumes e molho de ervas',
        detailedDescription: 'Filé de salmão fresco grelhado no ponto, acompanhado de legumes salteados na manteiga e molho de ervas finas',
        price: 48.9,
        category: 'MAIN_COURSE',
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927',
        allergens: ['FISH', 'DAIRY'],
      },
    }),

    // Acompanhamentos
    prisma.menuItem.create({
      data: {
        name: 'Batata Frita',
        description: 'Porção de batatas fritas crocantes',
        detailedDescription: 'Batatas frescas cortadas em palitos e fritas até ficarem douradas e crocantes',
        price: 15.0,
        category: 'SIDE_DISH',
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
        allergens: [],
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Arroz à Grega',
        description: 'Arroz branco com legumes salteados',
        detailedDescription: 'Arroz branco soltinho com cenoura, ervilha e milho salteados',
        price: 12.0,
        category: 'SIDE_DISH',
        available: true,
        allergens: [],
      },
    }),

    // Sobremesas
    prisma.menuItem.create({
      data: {
        name: 'Petit Gateau',
        description: 'Bolo de chocolate quente com sorvete',
        detailedDescription: 'Bolinho de chocolate com recheio cremoso quente, acompanhado de sorvete de creme',
        price: 22.0,
        category: 'DESSERT',
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51',
        allergens: ['GLUTEN', 'DAIRY', 'EGGS'],
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Cheesecake',
        description: 'Torta de cream cheese com calda de frutas vermelhas',
        detailedDescription: 'Torta cremosa de cream cheese sobre base de biscoito, finalizada com calda de frutas vermelhas',
        price: 18.5,
        category: 'DESSERT',
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1533134242820-ded77abc91fb',
        allergens: ['GLUTEN', 'DAIRY', 'EGGS'],
      },
    }),

    // Bebidas
    prisma.menuItem.create({
      data: {
        name: 'Suco Natural',
        description: 'Laranja, limão ou morango',
        detailedDescription: 'Suco natural preparado na hora com frutas frescas selecionadas',
        price: 8.0,
        category: 'BEVERAGE',
        available: true,
        allergens: [],
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Refrigerante',
        description: 'Lata 350ml',
        price: 6.0,
        category: 'BEVERAGE',
        available: true,
        allergens: [],
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Água Mineral',
        description: 'Com ou sem gás - 500ml',
        price: 4.5,
        category: 'BEVERAGE',
        available: true,
        allergens: [],
      },
    }),

    // Bebidas Alcoólicas
    prisma.menuItem.create({
      data: {
        name: 'Cerveja Artesanal',
        description: 'Long neck 355ml - IPA ou Pilsen',
        detailedDescription: 'Cerveja artesanal local, disponível em dois estilos: IPA (amarga e aromática) ou Pilsen (leve e refrescante)',
        price: 12.0,
        category: 'ALCOHOLIC_BEVERAGE',
        available: true,
        imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13',
        allergens: ['GLUTEN'],
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Caipirinha',
        description: 'Clássica de limão',
        detailedDescription: 'Drink tradicional brasileiro com cachaça, limão, açúcar e gelo',
        price: 16.0,
        category: 'ALCOHOLIC_BEVERAGE',
        available: true,
        allergens: [],
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Taça de Vinho',
        description: 'Tinto ou Branco - 150ml',
        detailedDescription: 'Seleção de vinhos tintos ou brancos servidos em taça generosa',
        price: 18.0,
        category: 'ALCOHOLIC_BEVERAGE',
        available: true,
        allergens: ['SULFITES'],
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
