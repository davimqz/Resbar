# Exemplos de chamadas curl para endpoints de métricas

Defina as variáveis de ambiente antes de usar:

- `BASE_URL` — base da API (ex: http://localhost:3333)
- `TOKEN` — token JWT com permissões (ADMIN/KITCHEN/WAITER conforme rota)

Exemplo (Linux / macOS / Git Bash):

```bash
export BASE_URL="http://localhost:3333"
export TOKEN="ey..."
```

- Overview (KPIs):

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/metrics/overview?start=2026-02-01&end=2026-02-02"
```

- Receita agregada (groupBy hour):

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/metrics/revenue?start=2026-02-01&end=2026-02-02&groupBy=hour"
```

- Cozinha (performance e atrasados):

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/metrics/kitchen?start=2026-02-01&end=2026-02-02&slaMinutes=12"
```

- Ranking de garçons:

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/metrics/waiters/ranking?start=2026-02-01&end=2026-02-02"
```

- Top itens do menu:

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/metrics/menu/top-items?start=2026-02-01&end=2026-02-02&limit=10"
```

Observações:

- Se estiver executando localmente e sem autenticação (somente para testes), remova o header `Authorization`.
- As rotas estão protegidas por middleware (`authenticateToken` + roles). Use um token válido.

Script de teste (abaixo) disponível em `test-metrics.js` para executar várias requisições sequenciais.
