# Resbar

Sistema de gestão para bares e restaurantes.

## Estrutura do Projeto

Monorepo com pnpm workspaces:

- **apps/api** - Backend Express + TypeScript
- **apps/web** - Frontend React + Vite + TypeScript
- **packages/database** - Prisma schema e migrations
- **packages/shared** - Tipos e validações compartilhadas

## Requisitos

- Node.js >= 18
- pnpm >= 8
- PostgreSQL

## Setup Inicial

```bash
# Instalar pnpm globalmente (se necessário)
npm install -g pnpm

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Editar packages/database/.env e apps/api/.env com suas credenciais do PostgreSQL

# Executar migrations do banco de dados
pnpm db:migrate

# Iniciar desenvolvimento (API + Web)
pnpm dev
```

## Scripts Disponíveis

- `pnpm dev` - Inicia API e Web em modo desenvolvimento
- `pnpm dev:api` - Inicia apenas a API
- `pnpm dev:web` - Inicia apenas o frontend
- `pnpm db:migrate` - Executa migrations do Prisma
- `pnpm db:studio` - Abre Prisma Studio
- `pnpm build` - Build de produção
- `pnpm type-check` - Verificação de tipos TypeScript
- `pnpm lint` - Linting de código

## Tecnologias

- **Backend**: Node.js, Express, Prisma, PostgreSQL, TypeScript
- **Frontend**: React, Vite, TailwindCSS, React Query, Zustand, TypeScript
- **Monorepo**: pnpm workspaces
- **Validação**: Zod

## Features do MVP

- ✅ Gerenciamento de mesas (CRUD, status, localização)
- ✅ Sistema de comandas individuais por pessoa
- ✅ Registro de pedidos por garçom
- ✅ Interface da cozinha para visualizar pedidos
- ✅ Cardápio digital
- ✅ Calculadora de totais (por pessoa e por mesa)
- ✅ Associação de garçons às mesas
- ✅ Controle de status de pedidos (pending → preparing → ready → delivered)
