# Configuração de Deploy - ResBar

## Variáveis de Ambiente Necessárias

### Vercel (Frontend - apps/web)

Configure no dashboard do Vercel (Settings → Environment Variables):

```
VITE_API_URL=https://resbar-api.onrender.com
VITE_GOOGLE_CLIENT_ID=1034610089308-o0kqbbbnk2omoivucge73rt0bjgi7h3s.apps.googleusercontent.com
```

**Importante:**
- `VITE_API_URL` deve apontar para a URL do seu backend no Render (sem `/api` no final)
- Essas variáveis devem ser configuradas para os ambientes: **Production**, **Preview**, e **Development**

### Render (Backend - apps/api)

Configure no dashboard do Render (Environment):

```
NODE_ENV=production
PORT=3000
DATABASE_URL=(gerado automaticamente pelo Render PostgreSQL)
JWT_SECRET=(gerado automaticamente)
SESSION_SECRET=(gerado automaticamente)
GOOGLE_CLIENT_ID=1034610089308-o0kqbbbnk2omoivucge73rt0bjgi7h3s.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=(seu secret do Google Cloud Console)
FRONTEND_URL=https://resbar-web.vercel.app
```

**Importante:**
- `FRONTEND_URL` deve ser a URL do seu frontend no Vercel
- Adicione também URLs de preview do Vercel se quiser testar branches

## Configuração do Google OAuth

### 1. Authorized JavaScript origins

No Google Cloud Console → Credentials → OAuth 2.0 Client → Authorized JavaScript origins:

```
http://localhost:5173
https://resbar-web.vercel.app
https://resbar-web-*.vercel.app  (para preview deploys)
```

### 2. Authorized redirect URIs

```
http://localhost:5173
https://resbar-web.vercel.app
```

## CORS e Headers

### Backend (Render)

O backend já está configurado com:
- CORS permitindo `FRONTEND_URL`
- `helmet` com `crossOriginOpenerPolicy: 'same-origin-allow-popups'`

### Frontend (Vercel)

O Vercel não precisa de configuração especial de headers para OAuth funcionaroptional: adicione em `vercel.json` se quiser habilitar One Tap:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin-allow-popups"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "unsafe-none"
        }
      ]
    }
  ]
}
```

## Checklist de Deploy

- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Configurar variáveis de ambiente no Render
- [ ] Adicionar origins no Google Cloud Console
- [ ] Verificar que `FRONTEND_URL` no backend = URL do Vercel
- [ ] Verificar que `VITE_API_URL` no frontend = URL do Render
- [ ] Rebuild do frontend no Vercel para pegar novas env vars
- [ ] Testar login com Google

## Troubleshooting

### Erro "Network Error" no login

**Causa:** Frontend não consegue acessar backend.

**Solução:**
1. Verifique se `VITE_API_URL` está configurado no Vercel
2. Faça um redeploy no Vercel para aplicar as variáveis
3. Teste a URL do backend diretamente: `https://sua-api.onrender.com/health`

### Erro "CORS" no console

**Causa:** Backend não permite origin do frontend.

**Solução:**
1. Verifique se `FRONTEND_URL` no Render está correto
2. Inclua URL de preview se estiver testando: adicione múltiplos origins separados por vírgula ou ajuste o CORS para aceitar padrões

### Erro "Cross-Origin-Opener-Policy"

**Causa:** Google One Tap (FedCM) precisa de headers especiais.

**Solução:**
- One Tap está desabilitado em produção por padrão
- Para habilitar, adicione headers no `vercel.json` (veja acima)
- Ou continue sem One Tap (usuário clica no botão normalmente)

## Comandos Úteis

### Rebuild frontend com novas env vars
```bash
# No Vercel dashboard, vá em Deployments → [...] → Redeploy
```

### Verificar build local com env de produção
```bash
cd apps/web
pnpm build
# Verifica se VITE_API_URL foi incluído no bundle
grep -r "localhost:3000" dist/  # não deve retornar nada
```

### Testar API localmente
```bash
curl https://sua-api.onrender.com/health
curl https://sua-api.onrender.com/api/menu-items
```
