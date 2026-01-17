# API Documentation - Resbar

Base URL: `http://localhost:3000/api`

## 📋 Endpoints

### Health Check
```
GET /health
```
Verifica se a API está funcionando.

---

## 👨‍🍳 Waiters (Garçons)

### Listar todos os garçons
```
GET /api/waiters
```

### Buscar garçom por ID
```
GET /api/waiters/:id
```

### Criar garçom
```
POST /api/waiters
Content-Type: application/json

{
  "name": "João Silva",
  "active": true
}
```

### Atualizar garçom
```
PUT /api/waiters/:id
Content-Type: application/json

{
  "name": "João Silva Atualizado",
  "active": false
}
```

### Deletar garçom
```
DELETE /api/waiters/:id
```

---

## 🪑 Tables (Mesas)

### Listar todas as mesas
```
GET /api/tables
```
Retorna mesas com informações de garçom e comandas abertas.

### Buscar mesa por ID
```
GET /api/tables/:id
```
Retorna detalhes completos da mesa incluindo todas as comandas e pedidos.

### Criar mesa
```
POST /api/tables
Content-Type: application/json

{
  "number": 1,
  "location": "Área externa",
  "capacity": 4,
  "waiterId": "clxxx..."  // opcional
}
```

### Atualizar mesa
```
PUT /api/tables/:id
Content-Type: application/json

{
  "number": 2,
  "location": "Salão principal",
  "capacity": 6,
  "status": "OCCUPIED",
  "waiterId": "clxxx..."
}
```

### Atualizar status da mesa
```
PATCH /api/tables/:id/status
Content-Type: application/json

{
  "status": "AVAILABLE" | "OCCUPIED" | "RESERVED"
}
```

### Atribuir garçom à mesa
```
POST /api/tables/:id/assign-waiter
Content-Type: application/json

{
  "waiterId": "clxxx..." // ou null para remover
}
```

### Deletar mesa
```
DELETE /api/tables/:id
```

---

## 👤 Persons (Pessoas)

### Adicionar pessoa à mesa
```
POST /api/persons
Content-Type: application/json

{
  "name": "Carlos Silva",
  "tableId": "clxxx..."
}
```
Cria automaticamente uma comanda (tab) para a pessoa e atualiza o status da mesa para OCCUPIED.

### Buscar pessoa por ID
```
GET /api/persons/:id
```

### Remover pessoa
```
DELETE /api/persons/:id
```
Remove a pessoa e sua comanda. Se for a última pessoa da mesa, atualiza o status da mesa para AVAILABLE.

---

## 🧾 Tabs (Comandas)

### Listar todas as comandas
```
GET /api/tabs
```

### Buscar comanda por ID
```
GET /api/tabs/:id
```

### Buscar comandas de uma mesa
```
GET /api/tabs/table/:tableId
```
Retorna apenas comandas abertas (OPEN).

### Fechar comanda
```
PATCH /api/tabs/:id/close
```

### Calcular total da comanda
```
GET /api/tabs/:id/calculate
```
Retorna:
```json
{
  "tabId": "clxxx...",
  "personName": "Carlos Silva",
  "items": [...],
  "subtotal": 150.00,
  "total": 150.00
}
```

### Calcular total da mesa
```
GET /api/tabs/table/:tableId/calculate
```
Retorna totais de todas as comandas da mesa:
```json
{
  "tableId": "clxxx...",
  "tableNumber": 1,
  "tabs": [
    {
      "tabId": "clxxx...",
      "personName": "Carlos Silva",
      "items": [...],
      "subtotal": 75.00,
      "total": 75.00
    },
    {
      "tabId": "clxxx...",
      "personName": "Ana Costa",
      "items": [...],
      "subtotal": 80.00,
      "total": 80.00
    }
  ],
  "grandTotal": 155.00
}
```

---

## 🍽️ Orders (Pedidos)

### Listar todos os pedidos
```
GET /api/orders
```

### Buscar pedido por ID
```
GET /api/orders/:id
```

### Criar pedido
```
POST /api/orders
Content-Type: application/json

{
  "tabId": "clxxx...",
  "menuItemId": "clxxx...",
  "quantity": 2,
  "notes": "Sem cebola"  // opcional
}
```
Calcula automaticamente o preço total e atualiza o total da comanda.

### Atualizar pedido
```
PUT /api/orders/:id
Content-Type: application/json

{
  "quantity": 3,
  "status": "PREPARING",
  "notes": "Com bastante molho"
}
```

### Atualizar status do pedido
```
PATCH /api/orders/:id/status
Content-Type: application/json

{
  "status": "PENDING" | "PREPARING" | "READY" | "DELIVERED"
}
```

### Deletar pedido
```
DELETE /api/orders/:id
```
Atualiza o total da comanda após remoção.

### Listar pedidos da cozinha
```
GET /api/orders/kitchen/pending
```
Retorna pedidos com status PENDING, PREPARING ou READY, ordenados por data de criação.

---

## 📖 Menu Items (Itens do Cardápio)

### Listar itens do cardápio
```
GET /api/menu-items
GET /api/menu-items?category=MAIN_COURSE
GET /api/menu-items?available=true
```

### Buscar item por ID
```
GET /api/menu-items/:id
```

### Criar item
```
POST /api/menu-items
Content-Type: application/json

{
  "name": "Filé à Parmegiana",
  "description": "Filé grelhado com molho de tomate",
  "price": 42.90,
  "category": "MAIN_COURSE",
  "available": true,
  "imageUrl": "https://..."  // opcional
}
```

**Categorias disponíveis:**
- `APPETIZER` - Entrada
- `MAIN_COURSE` - Prato Principal
- `SIDE_DISH` - Acompanhamento
- `DESSERT` - Sobremesa
- `BEVERAGE` - Bebida
- `ALCOHOLIC_BEVERAGE` - Bebida Alcoólica

### Atualizar item
```
PUT /api/menu-items/:id
Content-Type: application/json

{
  "name": "Filé à Parmegiana Premium",
  "price": 48.90,
  "available": false
}
```

### Alternar disponibilidade
```
PATCH /api/menu-items/:id/availability
```
Inverte o status `available` do item (true → false ou false → true).

### Deletar item
```
DELETE /api/menu-items/:id
```

---

## 📝 Respostas Padrão

### Sucesso
```json
{
  "success": true,
  "data": { ... }
}
```

### Erro
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

### Erro de Validação
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "path": ["name"],
      "message": "Nome deve ter no mínimo 2 caracteres"
    }
  ]
}
```

---

## 🔄 Status dos Pedidos (Fluxo)

```
PENDING (Pendente)
    ↓
PREPARING (Em Preparo)
    ↓
READY (Pronto)
    ↓
DELIVERED (Entregue)
```

---

## 🪑 Status das Mesas

- `AVAILABLE` - Disponível
- `OCCUPIED` - Ocupada
- `RESERVED` - Reservada

---

## 📋 Status das Comandas

- `OPEN` - Aberta
- `CLOSED` - Fechada

---

## 🧪 Exemplos de Uso

### Fluxo Completo: Atendimento de Mesa

1. **Criar mesa**
```bash
POST /api/tables
{"number": 5, "location": "Varanda", "capacity": 4}
```

2. **Atribuir garçom**
```bash
POST /api/tables/{tableId}/assign-waiter
{"waiterId": "{waiterId}"}
```

3. **Adicionar primeira pessoa**
```bash
POST /api/persons
{"name": "João", "tableId": "{tableId}"}
```

4. **Adicionar segunda pessoa**
```bash
POST /api/persons
{"name": "Maria", "tableId": "{tableId}"}
```

5. **Fazer pedido para João**
```bash
POST /api/orders
{"tabId": "{joaoTabId}", "menuItemId": "{itemId}", "quantity": 1}
```

6. **Fazer pedido para Maria**
```bash
POST /api/orders
{"tabId": "{mariaTabId}", "menuItemId": "{itemId}", "quantity": 2}
```

7. **Calcular total da mesa**
```bash
GET /api/tabs/table/{tableId}/calculate
```

8. **Avançar status do pedido na cozinha**
```bash
PATCH /api/orders/{orderId}/status
{"status": "PREPARING"}
```

9. **Liberar mesa**
```bash
PATCH /api/tables/{tableId}/status
{"status": "AVAILABLE"}
```

---

## 🔐 Autenticação

**Não implementado no MVP** - Todos os endpoints estão abertos.

Planejado para futuras versões:
- JWT Authentication
- Roles: Admin, Waiter, Kitchen
- Login/Logout endpoints
