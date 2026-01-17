# Guia de Configuração e Execução - Resbar

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

1. **Node.js** (versão 18 ou superior)
2. **pnpm** (versão 8 ou superior) - Já instalado ✅
3. **PostgreSQL** (versão 12 ou superior)

## 🗄️ Configuração do PostgreSQL

### Opção 1: PostgreSQL Local

1. **Instale o PostgreSQL** se ainda não tiver:
   - Windows: https://www.postgresql.org/download/windows/
   - Ou use o instalador: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Inicie o serviço do PostgreSQL**

3. **Crie o banco de dados**:
   ```sql
   CREATE DATABASE resbar;
   ```

4. **Atualize as credenciais** nos arquivos `.env`:
   - `packages/database/.env`
   - `apps/api/.env`
   
   Altere a linha `DATABASE_URL` conforme suas credenciais:
   ```
   DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/resbar?schema=public"
   ```

### Opção 2: PostgreSQL com Docker (mais fácil)

```powershell
# Executar PostgreSQL em container Docker
docker run --name resbar-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=resbar -p 5432:5432 -d postgres:15
```

As credenciais padrão já estão configuradas nos arquivos `.env`:
- Usuário: `postgres`
- Senha: `postgres`
- Banco: `resbar`
- Porta: `5432`

## 🚀 Inicialização do Projeto

### 1. Executar Migrations do Prisma

```powershell
cd c:\Users\davio\projects\davi\resbar
pnpm db:migrate
```

Este comando irá:
- Criar todas as tabelas no banco de dados
- Gerar o Prisma Client

### 2. Popular o Banco com Dados Iniciais (Opcional mas Recomendado)

```powershell
pnpm --filter database seed
```

Isso criará:
- 2 garçons de exemplo
- 4 mesas
- 15 itens no cardápio (entradas, pratos, sobremesas, bebidas)

### 3. Iniciar o Sistema

```powershell
# Iniciar API e Frontend juntos
pnpm dev
```

Ou iniciar separadamente:

```powershell
# Terminal 1 - API
pnpm dev:api

# Terminal 2 - Frontend
pnpm dev:web
```

## 🌐 Acessar o Sistema

Após iniciar, o sistema estará disponível em:

- **Frontend (Interface Web)**: http://localhost:5173
- **API (Backend)**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📱 Como Usar o Sistema

### 1. Gerenciar Garçons
- Acesse: **Garçons** no menu
- Adicione novos garçons ou edite os existentes

### 2. Gerenciar Cardápio
- Acesse: **Cardápio** no menu
- Adicione itens organizados por categoria
- Ative/desative disponibilidade

### 3. Gerenciar Mesas
- Acesse: **Mesas** no menu
- Crie novas mesas com número, localização e capacidade
- Clique em uma mesa para abrir detalhes

### 4. Atender Clientes (Fluxo Principal)
1. Clique em uma **mesa** na lista
2. **Adicionar pessoas** à mesa (cada pessoa terá sua própria comanda)
3. **Atribuir um garçom** à mesa
4. Para cada pessoa, clique em **"Adicionar Pedido"**
5. Selecione itens do cardápio, quantidade e observações
6. Os pedidos vão automaticamente para a **Cozinha**

### 5. Painel da Cozinha
- Acesse: **Cozinha** no menu
- Visualize pedidos em 3 colunas:
  - **Pendentes**: Novos pedidos aguardando preparo
  - **Em Preparo**: Pedidos sendo preparados
  - **Prontos**: Pedidos prontos para servir
- Avance o status dos pedidos com os botões

### 6. Calculadora de Totais
- Na tela de detalhes da mesa, veja:
  - Total individual de cada pessoa/comanda
  - Total geral da mesa

### 7. Liberar Mesa
- Na tela de detalhes da mesa, clique em **"Liberar Mesa"**
- A mesa voltará ao status "Disponível"

## 🔧 Comandos Úteis

```powershell
# Ver tabelas no Prisma Studio (GUI do banco)
pnpm db:studio

# Verificar tipos TypeScript
pnpm type-check

# Fazer lint do código
pnpm lint

# Build para produção
pnpm build

# Apenas API
pnpm dev:api

# Apenas Frontend
pnpm dev:web

# Criar nova migration
pnpm --filter database migrate:dev --name nome_da_migration

# Aplicar migrations em produção
pnpm --filter database migrate:deploy
```

## 🐛 Troubleshooting

### Erro: "Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `psql -U postgres -h localhost`

### Erro: "Port 3000 already in use"
- Algum processo está usando a porta 3000
- Mude a porta em `apps/api/.env`: `PORT=3001`
- Ou encerre o processo: `netstat -ano | findstr :3000` e `taskkill /PID <PID> /F`

### Erro: "Port 5173 already in use"
- Algum processo está usando a porta 5173
- O Vite tentará usar outra porta automaticamente

### Erros de TypeScript/Imports
```powershell
# Reinstalar dependências
rm -r node_modules
pnpm install

# Gerar Prisma Client novamente
pnpm --filter database generate
```

## 📊 Estrutura do Projeto

```
resbar/
├── apps/
│   ├── api/          # Backend Express + TypeScript
│   └── web/          # Frontend React + Vite
├── packages/
│   ├── database/     # Prisma schema e migrations
│   └── shared/       # Tipos e validações compartilhadas
└── package.json      # Root workspace
```

## 🎯 Features Implementadas (MVP)

✅ Gerenciamento de mesas (CRUD, status, localização)  
✅ Sistema de comandas individuais por pessoa  
✅ Registro de pedidos por garçom  
✅ Interface da cozinha com status de pedidos  
✅ Cardápio digital com categorias  
✅ Calculadora de totais (por pessoa e por mesa)  
✅ Associação de garçons às mesas  
✅ Controle de status: pending → preparing → ready → delivered  

## 🔮 Próximos Passos (Futuro)

- Sistema de autenticação/login
- Gestão de estoque
- Relatórios e analytics
- Impressão de comandas
- Integração com pagamento
- App mobile para garçons
