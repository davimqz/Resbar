# Configuração do Sistema de Autenticação

## Requisitos Adicionais

- Conta Google Cloud Platform (para OAuth)
- PostgreSQL rodando

## Passo 1: Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em "APIs & Services" > "Credentials"
4. Clique em "Create Credentials" > "OAuth Client ID"
5. Configure a tela de consentimento (OAuth consent screen) se necessário
6. Selecione "Web application" como tipo
7. Adicione as URLs autorizadas:
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: `http://localhost:5173` (frontend irá lidar)
8. Copie o **Client ID** gerado

## Passo 2: Configurar Variáveis de Ambiente

### Backend (apps/api/.env)

Copie `.env.example` para `.env` e configure:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/resbar?schema=public"

# Gere chaves secretas fortes (pode usar: openssl rand -base64 32)
JWT_SECRET=sua-chave-jwt-super-secreta-aqui
SESSION_SECRET=sua-chave-session-super-secreta-aqui

# Google OAuth
GOOGLE_CLIENT_ID=seu-google-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-google-client-secret-aqui
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### Frontend (apps/web/.env)

Copie `.env.example` para `.env` e configure:

```env
VITE_API_URL=http://localhost:3000

# Google OAuth (mesmo Client ID do backend)
VITE_GOOGLE_CLIENT_ID=seu-google-client-id-aqui
```

## Passo 3: Instalar Dependências e Migrar

```bash
# Na raiz do projeto
pnpm install

# Rodar migrations (já feito se você seguiu os passos anteriores)
cd packages/database
npx prisma migrate dev
```

## Passo 4: Criar Usuário Admin Inicial

Você pode criar um usuário admin diretamente no banco:

```sql
INSERT INTO users (id, email, name, role, "createdAt", "updatedAt")
VALUES (
  'admin-id-001',
  'seu-email@gmail.com',
  'Administrador',
  'ADMIN',
  NOW(),
  NOW()
);
```

Ou faça login normalmente com Google e depois atualize a role no banco:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'seu-email@gmail.com';
```

## Passo 5: Iniciar os Servidores

```bash
# Terminal 1 - Backend
cd apps/api
pnpm dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

## Roles do Sistema

- **STANDARD**: Cliente padrão (acesso básico)
- **WAITER**: Garçom (gerencia mesas, pedidos, cardápio, estoque)
- **KITCHEN**: Cozinha (visualiza pedidos, atualiza status)
- **ADMIN**: Administrador (acesso completo incluindo dashboard, garçons)

## Fluxo de Autenticação

1. Usuário clica em "Login com Google"
2. Google OAuth retorna credenciais
3. Frontend envia para `/api/auth/google`
4. Backend cria/atualiza usuário e retorna JWT
5. Se perfil incompleto, modal de completar dados aparece
6. Usuário preenche: nome, data de nascimento, gênero
7. Se gênero = "Outro", busca em lista predefinida
8. JWT é armazenado no localStorage (Zustand persist)
9. Refresh token é armazenado em httpOnly cookie

## Testando

1. Acesse `http://localhost:5173/login`
2. Faça login com sua conta Google
3. Complete o perfil se necessário
4. Você será redirecionado para `/tables`
5. Navegação será filtrada baseada na sua role

## Cores das Mesas

- **Verde**: Disponível (AVAILABLE)
- **Vermelho**: Ocupada (OCCUPIED)
- **Laranja**: Paga, aguardando liberação (PAID_PENDING_RELEASE)
- **Amarelo**: Reservada (RESERVED)

## Funcionalidades Implementadas

✅ Login com Google OAuth
✅ Perfil de usuário com gênero customizável
✅ 4 roles de acesso (Standard, Waiter, Kitchen, Admin)
✅ Navegação filtrada por role
✅ Dashboard com métricas (apenas Admin)
✅ Estoque (mockup, estrutura pronta)
✅ Sistema de liberação de mesa (Garçom)
✅ Timestamps de pagamento e liberação
✅ Proteção de rotas por autenticação e role
✅ Refresh token automático

## Próximos Passos

- Implementar funcionalidades do módulo de estoque
- Adicionar mais métricas ao dashboard
- Implementar notificações em tempo real
- Adicionar relatórios exportáveis
- Implementar gestão de turnos de trabalho
