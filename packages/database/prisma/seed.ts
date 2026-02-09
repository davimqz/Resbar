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

  // Criar mesas (usar upsert para evitar falhas se já existirem)
  const tables = [];
  const tableData = [
    { number: 1, location: 'Área externa', capacity: 4, waiterId: waiter1.id },
    { number: 2, location: 'Salão principal', capacity: 2 },
    { number: 3, location: 'Salão principal', capacity: 6, waiterId: waiter2.id },
    { number: 4, location: 'Varanda', capacity: 4 },
  ];

  for (const t of tableData) {
    const tb = await prisma.table.upsert({
      where: { number: t.number },
      update: {},
      create: t,
    });
    tables.push(tb);
  }

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

  // Criar usuário admin para testes (upsert para evitar duplicação)
  const admin = await prisma.user.upsert({
    where: { email: 'davimqz2003@gmail.com' },
    update: { name: 'Admin', role: 'ADMIN' },
    create: {
      email: 'davimqz2003@gmail.com',
      name: 'Admin',
      role: 'ADMIN',
      googleId: 'seed-admin',
    },
  });

  console.log('✅ Usuário admin criado/atualizado:', admin.email);

  // Criar/atualizar usuário Francisco como ADMIN
  const francisco = await prisma.user.upsert({
    where: { email: 'franciscojose002@gmail.com' },
    update: { name: 'Francisco', role: 'ADMIN' },
    create: {
      email: 'franciscojose002@gmail.com',
      name: 'Francisco',
      role: 'ADMIN',
      googleId: 'seed-francisco',
    },
  });

  console.log('✅ Usuário criado/atualizado (ADMIN):', francisco.email);

  // --- Gerar grande volume de dados históricos (pedidos, comandas, clientes)
  console.log('\n🛠️  Gerando dados históricos (várias dias e registros)...');

  // Helper functions
  function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Carregar menu items criados
  const items = menuItems.map((m: any) => m);

  // Criar mais garçons se necessário
  const extraWaiters = [];
  for (let i = 0; i < 5; i++) {
    const w = await prisma.waiter.create({
      data: {
        name: `Garcom Seed ${i + 1}`,
        active: true,
        onBreak: false,
      },
    });
    extraWaiters.push(w);
  }

  const allWaiters = [waiter1, waiter2, ...extraWaiters];

  // Criar lista de clientes (persons) e comandas históricas por dia
  const startDaysAgo = 21; // criar 21 dias de dados
  const today = new Date();

  const createdTabs: any[] = [];

  for (let d = startDaysAgo; d >= 0; d--) {
    const day = new Date(today);
    day.setDate(day.getDate() - d);
    day.setHours(12, 0, 0, 0);

    // gerar entre 10 e 30 comandas por dia
    const tabsCount = randInt(10, 30);
    for (let t = 0; t < tabsCount; t++) {
      const isCounter = Math.random() < 0.15; // 15% balcão
      const table = isCounter ? null : pick(tables);
      const tabType = isCounter ? 'COUNTER' : 'TABLE';

      const createdAt = new Date(day.getTime() + randInt(0, 10 * 60 * 60 * 1000)); // entre meio-dia e 10h

      // cria pessoa (cliente) para a comanda
      const person = await prisma.person.create({
        data: {
          name: `Cliente ${d}-${t}-${randInt(1,9999)}`,
          tabId: '', // será atualizado depois
        },
      }).catch(async () => {
        // fallback caso relação 1:1 impeça criação sem tab
        return null;
      });

      // Escolher um garçom e criar histórico
      const waiter = pick(allWaiters);

      // criar orders
      const ordersCount = randInt(1, 5);
      const ordersData: any[] = [];
      let total = 0;
      for (let o = 0; o < ordersCount; o++) {
        const menu = pick(items);
        const qty = randInt(1, 3);
        const unitPrice = menu.price;
        const orderTotal = +(unitPrice * qty).toFixed(2);
        total += orderTotal;

        const createdOffset = randInt(0, 45) * 60 * 1000; // within 45 minutes
        const created = new Date(createdAt.getTime() + createdOffset);
        const sentToKitchenAt = new Date(created.getTime() + randInt(1, 10) * 60 * 1000);
        const startedPreparingAt = new Date(sentToKitchenAt.getTime() + randInt(1, 5) * 60 * 1000);
        const readyAt = new Date(startedPreparingAt.getTime() + randInt(5, 25) * 60 * 1000);
        const deliveredAt = new Date(readyAt.getTime() + randInt(1, 10) * 60 * 1000);

        ordersData.push({
          menuItemId: menu.id,
          quantity: qty,
          unitPrice,
          totalPrice: orderTotal,
          status: 'DELIVERED',
          notes: Math.random() < 0.07 ? 'Sem cebola' : null,
          serviceChargeIncluded: Math.random() < 0.9,
          sentToKitchenAt,
          startedPreparingAt,
          readyAt,
          deliveredAt,
          createdAt: created,
          updatedAt: deliveredAt,
        });
      }

      // service charge and paidAmount
      const serviceChargeIncluded = Math.random() < 0.85;
      const paid = Math.random() < 0.95; // 95% paid
      const paidAt = paid ? new Date(createdAt.getTime() + randInt(30, 180) * 60 * 1000) : null;
      const paidAmount = paid ? +(total + (serviceChargeIncluded ? total * 0.1 : 0)).toFixed(2) : null;
      const changeAmount = paid && Math.random() < 0.3 ? +(randInt(0, 10)).toFixed(2) : null;

      // create tab
      const tab = await prisma.tab.create({
        data: {
          tableId: table ? table.id : null,
          type: tabType,
          total: +total.toFixed(2),
          status: paid ? 'CLOSED' : 'OPEN',
          paymentMethod: paid ? pick(['CASH','CREDIT_CARD','DEBIT_CARD','PIX']) : null,
          paidAmount: paidAmount,
          changeAmount: changeAmount,
          serviceChargeIncluded: serviceChargeIncluded,
          serviceChargePaidSeparately: false,
          serviceChargeAmount: serviceChargeIncluded ? +(total * 0.1).toFixed(2) : 0,
          isUnifiedTab: false,
          unifiedTabPersonCount: 1,
          customerSeatedAt: new Date(createdAt.getTime() - randInt(1,10)*60*1000),
          requestedBillAt: paid ? new Date(paidAt!.getTime() - randInt(1,15)*60*1000) : null,
          paidAt: paidAt,
          createdAt,
          updatedAt: paidAt ?? createdAt,
          closedAt: paid ? new Date(createdAt.getTime() + randInt(20, 300) * 60 * 1000) : null,
          orders: {
            create: ordersData.map((od) => ({
              menuItemId: od.menuItemId,
              quantity: od.quantity,
              unitPrice: od.unitPrice,
              totalPrice: od.totalPrice,
              status: od.status,
              notes: od.notes,
              serviceChargeIncluded: od.serviceChargeIncluded,
              sentToKitchenAt: od.sentToKitchenAt,
              startedPreparingAt: od.startedPreparingAt,
              readyAt: od.readyAt,
              deliveredAt: od.deliveredAt,
              createdAt: od.createdAt,
              updatedAt: od.updatedAt,
            })),
          },
          waiterHistory: {
            create: {
              waiterId: waiter.id,
              assignedAt: new Date(createdAt.getTime() - randInt(1,5) * 60 * 1000),
              removedAt: paid ? new Date((paidAt ?? createdAt).getTime() + randInt(1,10) * 60 * 1000) : null,
            },
          },
        },
      });

      // If person created earlier with missing tabId, try to link it
      if (person && person.tabId === '') {
        await prisma.person.update({ where: { id: person.id }, data: { tabId: tab.id } }).catch(() => {});
      } else if (!person) {
        // create person associated with tab
        await prisma.person.create({ data: { name: `Cliente ${tab.id.substring(0,6)}`, tabId: tab.id } }).catch(() => {});
      }

      createdTabs.push(tab);
    }
  }

  console.log(`✅ Geradas ${createdTabs.length} comandas em ${startDaysAgo + 1} dias`);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log(`📊 Resumo:`);
  console.log(`   - ${allWaiters.length} garçons`);
  console.log(`   - ${tables.length} mesas`);
  console.log(`   - ${menuItems.length} itens no cardápio`);
  console.log(`   - ${createdTabs.length} comandas (várias datas)`);
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
