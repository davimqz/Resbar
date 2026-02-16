# Relatório de Métricas — Estrutura de Dados e Métricas Extraíveis

Este documento lista, de forma estruturada, os campos (dados puros) e as métricas que o sistema pode extrair (micro e macro). Use como referência rápida para análises e geração de queries.

---

## 1) Entidades & Campos (dados puros)

- `User`: `id`, `email`, `name`, `birthdate`, `gender`, `customGender`, `role`, `googleId`, `avatar`, `createdAt`, `updatedAt`
- `Waiter`: `id`, `name`, `active`, `onBreak`, `breakStartedAt`, `clockedInAt`, `clockedOutAt`, `createdAt`, `updatedAt`
- `Table`: `id`, `number`, `location`, `capacity`, `status`, `waiterId`, `allTabsPaidAt`, `releasedAt`, `createdAt`, `updatedAt`
- `Person`: `id`, `name`, `tabId`, `createdAt`, `updatedAt`
- `Tab`: `id`, `tableId`, `type`, `total`, `status`, `paymentMethod`, `paidAmount`, `changeAmount`, `serviceChargeIncluded`, `serviceChargePaidSeparately`, `serviceChargeAmount`, `isUnifiedTab`, `unifiedTabPersonCount`, `customerSeatedAt`, `requestedBillAt`, `paidAt`, `createdAt`, `updatedAt`, `closedAt`
- `Order`: `id`, `tabId`, `menuItemId`, `quantity`, `unitPrice`, `totalPrice`, `status`, `notes`, `serviceChargeIncluded`, `sentToKitchenAt`, `startedPreparingAt`, `readyAt`, `deliveredAt`, `createdAt`, `updatedAt`
- `MenuItem`: `id`, `name`, `description`, `detailedDescription`, `price`, `category`, `available`, `imageUrl`, `allergens`, `createdAt`, `updatedAt`
- `InventoryItem`: `id`, `name`, `quantity`, `unit`, `minStock`, `category`, `createdAt`, `updatedAt`
- `TabWaiterHistory`: `id`, `tabId`, `waiterId`, `assignedAt`, `removedAt`

---

## 2) Micro métricas / dados por registro

- Comanda (Tab): `total`, `paidAmount`, `serviceChargeAmount`, `type`, `tableId`, `paidAt`, `createdAt`, `closedAt`, `customerSeatedAt`
- Pedido (Order): `menuItemId`, `quantity`, `unitPrice`, `totalPrice`, `status`, `sentToKitchenAt`, `readyAt`, `deliveredAt`, `createdAt`
- Menu item: `price`, `available`, `category`, `allergens`
- Garçom: `clockedInAt`, `clockedOutAt`, `onBreak`, `breakStartedAt`

---

## 3) Métricas micro-derivadas (por registro/curto período)

- Tempo de atendimento por pedido = `deliveredAt - sentToKitchenAt`
- Tempo de preparo = `readyAt - startedPreparingAt`
- Tempo até pagamento por comanda = `paidAt - customerSeatedAt`
- Valor médio por item na comanda = `total / SUM(quantity)` (por `tab`)
- Itens mais pedidos por comanda = agregação de `menuItemId` por `tabId`

---

## 4) Métricas macro / agregadas (diárias/semanais/mensais)

- Receita total (por intervalo) = SUM(`paidAmount`) ou SUM(`total`) filtrado por `paidAt`
- Receita por método de pagamento = agregação por `paymentMethod`
- Ticket médio = Receita total / número de `Tab` pagas
- Número de comandas (covers) por período = COUNT(`Tab`)
- Covers por mesa = COUNT(`Tab`) por `tableId`
- Ocupação média de mesas = tempo ocupado (sum(`closedAt - customerSeatedAt`)) por mesa dividido por janela de tempo
- Top N itens vendidos = SUM(`quantity`) agrupado por `menuItemId`
- Mix de vendas por categoria = SUM(`totalPrice`) por `menuItem.category`
- Receita por garçom = SUM(`totalPrice` ou `paidAmount`) associada via `TabWaiterHistory` / `waiterId`
- Tempo médio de preparo (cozinha) = AVG(`readyAt - startedPreparingAt`)

---

## 5) KPIs operacionais

- Average Check (Ticket Médio) por turno/dia/garçom
- Throughput por hora (comandas fechadas por hora)
- Tempo médio até entrega (SLA cozinha)
- Percentual de pedidos atrasados (readyAt - startedPreparingAt > threshold)
- Utilização de mesas (%) e turnover rate (rotatividade)

---

## 6) Métricas de estoque / recursos

- Nível atual de estoque = `quantity` por `InventoryItem`
- Itens abaixo do mínimo = FILTER `InventoryItem` WHERE `quantity <= minStock`
- Consumo médio por dia (requer mapeamento MenuItem→InventoryItem) — atualmente não modelado

---

## 7) Métricas de usuário / cliente

- Usuários cadastrados por período = COUNT(`User.createdAt`)
- Distribuição demográfica = distribuição por `gender`, faixa etária (calcular a partir de `birthdate`)
- Usuários por `role` = COUNT por `User.role`

---

## 8) Métricas de qualidade de serviço (derivadas de timestamps)

- SLA cozinha = percentil/avg(`readyAt - sentToKitchenAt`)
- SLA entrega = AVG(`deliveredAt - readyAt`)
- Abandono / não pagamento = % de `Tab` sem `paidAt` após X horas

---

## 9) Dimensões e filtros úteis

- Tempo: `createdAt`, `paidAt`, `closedAt`, `sentToKitchenAt`, `readyAt`, `deliveredAt`
- Local: `tableId`, `location`, `type` (`TABLE`/`COUNTER`)
- Staff: `waiterId`, `TabWaiterHistory`
- Produto: `menuItemId`, `category`, `available`
- Pagamento: `paymentMethod`
- Status: `Order.status`, `Tab.status`, `Table.status`

---

## 10) Limitações (dados não capturados)

- Custo unitário de `MenuItem` (impede cálculo direto de margem)
- Logs de sessão/login (não há tabela de sessions)
- Vinculação explícita `User` → `Tab` (não há `userId` nas `Tab` por padrão)
- Relação MenuItem→InventoryItem para consumo/receitas (necessária para COGS)

---

## 11) Formatos sugeridos de exportação

- JSON por entidade (ex.: `{ users: [...], tabs: [...], orders: [...] }`)
- CSV por métrica agregada (ex.: `revenue_by_day.csv`, `top_items.csv`)
- Queries recomendadas: posso fornecer um conjunto de queries Prisma/SQL para calcular cada métrica listada.

---

Se quiser, eu gero agora: 1) JSON export por entidade; 2) SQL/Prisma queries para cada métrica; ou 3) CSVs prontos. Diga qual opção prefere.
