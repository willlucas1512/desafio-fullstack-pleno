# Painel de Acompanhamento — PCRJ

Painel pra técnicos da Prefeitura acompanharem crianças em situação de vulnerabilidade social, cruzando dados de saúde, educação e assistência social. Monorepo com API Fastify + frontend Next.js.

> Submissão do desafio fullstack pleno.

## Quickstart

```bash
git clone https://github.com/willlucas1512/desafio-fullstack-pleno.git
cd desafio-fullstack-pleno
docker compose up
```

Abre [http://localhost:3000](http://localhost:3000) e loga.

### Credenciais de teste

| Campo | Valor |
|---|---|
| E-mail | `tecnico@prefeitura.rio` |
| Senha | `painel@2024` |

> Conflito de porta? `WEB_HOST_PORT=3010 docker compose up`.

## Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Backend | Node.js 22 + TypeScript + Fastify | Schema validation embutido, ~2× Express, tipos consistentes com o front |
| Auth | `@fastify/jwt` HS256 | Padrão |
| Persistência | In-memory hidratado do `data/seed.json` | 25 registros e uma mutation — Postgres aqui é overkill. `ChildrenRepository` é uma classe injetável, então trocar por SQL é um swap |
| Frontend | Next.js 15 (App Router) + React 18 + TypeScript | Especificado |
| UI | Tailwind + shadcn/ui + lucide | Componentes copiados pra `src/components/ui/`, controle total |
| Estado servidor | TanStack Query v5 | Cache + invalidation |
| Formulários | react-hook-form + Zod | Mesma stack do back |
| Gráficos | Recharts | |
| Toasts | Sonner | |
| Tema | next-themes (claro/escuro/sistema) | |
| Testes back | Vitest + `fastify.inject()` | HTTP sem network |
| Testes front | Vitest + Testing Library | |
| E2E | Playwright | |
| Infra | Docker Compose multi-stage | Runtime ~120 MB cada, non-root |

## Rodando local sem Docker

```bash
npm install
npm run dev:api   # 3001
npm run dev:web   # 3000
```

As credenciais default da `docker-compose.yml` batem com o enunciado. Pra rodar a API direto pelo Node, copia `apps/api/.env.example` pra `apps/api/.env` (os valores já estão lá).

## API

Base: `http://localhost:3001`.

### `POST /auth/token`
```json
// req
{ "email": "tecnico@prefeitura.rio", "password": "painel@2024" }
// res 200
{ "access_token": "eyJ...", "token_type": "Bearer" }
```
JWT inclui `preferred_username` com o email. 401 em credencial errada, 400 em payload malformado.

### `GET /children`
Query params (opcionais):

| Param | Valores | |
|---|---|---|
| `bairro` | string | acento- e case-insensitive |
| `alertas` | `com` \| `sem` \| `saude` \| `educacao` \| `assistencia_social` | geral ou por área |
| `revisado` | `true` \| `false` | |
| `page` | int ≥ 1, default 1 | |
| `pageSize` | int 1..100, default 10 | |

```json
{
  "items": [{ "id": "c001", "nome": "...", "saude": { ... } | null, ... }],
  "pagination": { "page": 1, "pageSize": 10, "total": 25, "totalPages": 3 }
}
```

### `GET /children/:id`
200 com a criança, 404 senão.

### `GET /children/neighborhoods`
`{ "bairros": ["Complexo do Alemão", "Jacarezinho", ...] }` — usado pelo filtro do front.

### `GET /summary`
```json
{
  "total_criancas": 25,
  "com_alertas": 17,
  "sem_alertas": 7,
  "sem_dados": 1,
  "revisadas": 4,
  "pendentes_revisao": 21,
  "alertas_por_area": { "saude": 8, "educacao": 9, "assistencia_social": 8 },
  "por_bairro": [{ "bairro": "Rocinha", "total": 5, "com_alertas": 4, "sem_dados": 0 }, ...],
  "cobertura": { "com_saude": 23, "com_educacao": 20, "com_assistencia_social": 21, "sem_nenhuma_area": 1 }
}
```

`sem_dados` é separado de `sem_alertas` de propósito: c015 (saúde+educação+assistência todos `null`) não é o mesmo que uma criança verificada e sem alertas. O painel reflete isso.

### `PATCH /children/:id/review`
Requer `Authorization: Bearer <token>`. Retorna a criança atualizada (`revisado: true`, `revisado_por` = email do JWT, `revisado_em` = ISO). 401 sem token, 404 se id não existe.

## Frontend

```
/           → /dashboard
/login      → form público; preserva `?next=`
/dashboard  → KPI cards + alertas/área + revisão + mapa de calor por bairro
/children   → lista + filtros (URL-driven) + paginação
/children/[id] → 3 cards (saúde/educação/assistência) + ação de revisar
```

### Proteção de rotas
Layout `(dashboard)/layout.tsx` é o único ponto de proteção: lê JWT do `localStorage`, decoda (sem verificar assinatura — server faz), checa `exp`. Sem token ou expirado vai pra `/login?next=<path>`. Enquanto valida mostra spinner.

Interceptor do Axios cobre o caso de o token expirar durante a sessão: qualquer 401 limpa storage e redireciona pra `/login?reason=expired` com mensagem amigável.

### Estado/cache
TanStack Query por feature (`useChildren`, `useSummary`, `useChild`, `useReviewChild`). `placeholderData: (prev) => prev` evita flash na paginação. A mutation de revisar atualiza o cache da criança e invalida lista + summary.

### Filtros na URL
`/children?bairro=Rocinha&alertas=com`. Compartilhável, voltar funciona, os cards do dashboard drill-down direto com filtro.

### Responsividade
Mobile-first, testado de 375px a 1440px. Header com hambúrguer abaixo de `md`. Gráficos do dashboard reflowam pra coluna única no mobile.

### Acessibilidade
- Landmarks: `<header>`, `<nav aria-label>`, `<main>`
- `<Label htmlFor>`, `aria-invalid`, `aria-describedby` nos inputs
- Status por área codificado em ícone + cor + texto sr-only (não depende só de cor)
- Navegação por teclado coberta no Playwright

### Dark mode
`next-themes` em modo `class`. Toggle no header. CSS vars do shadcn ajustadas pra par light/dark com contraste WCAG AA.

## Casos-limite do seed

| Caso | Conteúdo | Como o painel mostra |
|---|---|---|
| c015 | Todas as 3 áreas `null` | 3 cards `EmptyArea` no detalhe; entra em `sem_dados` no summary (não em `sem_alertas`) |
| c005 | Só saúde | 1 card + 2 EmptyArea; row da lista com 1 verde + 2 cinzas |
| c004/c009/c023 | Sem saúde | Card de saúde vira EmptyArea |
| c011/c017 | `escola: null`, `frequencia_percent: null`, alerta `matricula_pendente` | Renderiza "Não informada" e `—`, mas exibe o alerta |
| c014/c025 | Alertas nas 3 áreas | 3 pontos vermelhos na lista, 3 cards com badges |
| c012/c021 | Sem assistência social | Card específico vira EmptyArea |

Frequência abaixo de 75% renderiza em vermelho no detalhe.

## Testes

```bash
npm test --workspaces            # 47 backend + 31 frontend
npm run test:e2e --workspace=apps/web   # 11 specs Playwright (precisa de npx playwright install chromium 1x)
npm run typecheck --workspaces   # zero erros
```

Cobertura:
- **Back (47):** auth (constant-time), filtros (acento-insensitive, composição), paginação edges, agregação do `/summary`, todos os caminhos HTTP (200/400/401/404) via `inject()`, parse do seed real.
- **Front (31):** formatters (data, idade timezone-safe, JWT decode), badges, 3-state área, EmptyArea, KPI card, neighborhood heatmap, coverage, ReviewAction com mutation mock.
- **E2E (11):** redirect não-autenticado, login ok/erro, filtros, detalhe com 3 EmptyArea (c015), revisão com feedback, navegação por teclado, landmarks ARIA, layout a 375px sem overflow em login/dashboard/lista/detalhe.

## Decisões

### 1. In-memory (sem DB)
Repositório lê seed.json no boot, mantém em `Map`. PATCH atualiza memória, reinicia volta ao seed. Com mais tempo: SQLite ou tabela `reviews` num Postgres.

### 2. Node + Fastify
Mesma stack do front, tipos do domínio conceitualmente alinhados, Fastify entrega schema validation e ~2× Express. Go entregaria binário único e menos RAM, mas pra 25 registros e poucas RPS é imperceptível.

### 3. JWT em localStorage (vs cookie httpOnly)
Mais simples (sem CSRF/CORS dance). XSS é um risco mitigado por (a) zero HTML de input do usuário, (b) escape default do React, (c) sem `dangerouslySetInnerHTML`. Pra prod com dados sensíveis: cookie `HttpOnly; SameSite=Lax` + CSRF token nas mutáveis.

### 4. Proteção client-side (vs middleware Next)
Token tá no localStorage, que middleware do Next não acessa. Trade-off: flash de spinner antes do redirect. Aceitável pra painel interno.

### 5. Filtros na URL
Links compartilháveis, botão voltar funciona, drill-down dos cards do dashboard.

### 6. shadcn copiado vs lib instalada
Componentes ficam em `src/components/ui/`, customização versionada, sem upgrade surpresa quebrar layout.

### 7. `output: standalone` no Next
Imagem final ~150 MB porque traça só o que é usado. Sem essa flag, copiaríamos `node_modules` inteiro (~600 MB).

### 8. Config sensível em env (com defaults pro dev)
Defaults da `docker-compose.yml` batem com o enunciado pra `docker compose up` funcionar sem setup. Em prod, sobrescreve via env vars no orchestrator. Testes usam fixtures isoladas (`SAMPLE_*`) que não compartilham nada com config de deploy.

## Deploy

Configs prontas pra split deploy:
- **Vercel** (web): `apps/web/vercel.json`, região `gru1`
- **Render** (api): `render.yaml`, healthcheck em `/health`

Passos:
1. Render: novo Web Service → use `render.yaml`. Pega a URL pública.
2. Vercel: Import Project apontando pra `apps/web`. Define `NEXT_PUBLIC_API_URL` = URL da Render.
3. Volta no Render e define `CORS_ORIGIN` = URL pública do Vercel. Redeploy.

Não tem deploy publicado nessa submissão. Os configs estão lá pra apertar deploy.

## O que faria diferente com mais tempo

1. Persistência real pra revisões (SQLite ou tabela `reviews` em Postgres). `ChildrenRepository` é classe, é um swap.
2. Token em cookie httpOnly + middleware Next.js — elimina o flash de spinner.
3. Refresh token rotativo (hoje expira em 1h e força login).
4. CI no GitHub Actions: lint + typecheck + tests em PRs.
5. Tela dedicada de "Cobertura" listando casos sem dados em alguma área, ordenado por nº de áreas faltantes.
6. Audit log das revisões (event log).
7. Mapa geográfico real pro heatmap (leaflet + GeoJSON dos bairros do Rio). Hoje é categórico.
8. Storybook pros componentes de status.
9. Observabilidade: OpenTelemetry no back + Sentry no front.

## Histórico de commits

Histórico incremental (28 commits, Conventional Commits) mostrando a evolução do setup → API → frontend → docker compose → deploy → docs.

```bash
git log --oneline
```
