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
| Backend | Node.js 22 + TypeScript + Fastify | Schema validation embutido, tipos alinhados com o front |
| Auth | `@fastify/jwt` HS256 | Padrão |
| Persistência | Postgres | Fonte única; `data/seed.json` carrega no primeiro boot (idempotente), então revisões sobrevivem a reinícios |
| Frontend | Next.js 15 (App Router) + React 18 + TypeScript | Especificado |
| UI | Tailwind + shadcn/ui + lucide | Componentes copiados pra `src/components/ui/`, controle total |
| Estado servidor | TanStack Query v5 | Cache + invalidation |
| Formulários | react-hook-form + Zod | Mesma stack do back |
| Gráficos | Recharts | |
| Toasts | Sonner | |
| Tema | next-themes (claro/escuro/sistema) | |
| Testes back | Vitest + `fastify.inject()` + Testcontainers | HTTP sem network; Postgres real no teste do repositório |
| Testes front | Vitest + Testing Library | |
| E2E | Playwright | |
| Infra | Docker Compose multi-stage | Runtime enxuto, non-root |

## Rodando local sem Docker

Precisa de um Postgres acessível. O jeito mais simples é subir só o banco do compose:

```bash
docker compose up -d db
npm install
npm run dev:api   # 3001
npm run dev:web   # 3000
```

Os defaults da `docker-compose.yml` e do `apps/api/.env.example` batem com o enunciado. Pra rodar a API pelo Node, copia `apps/api/.env.example` pra `apps/api/.env`.

## API

Base: `http://localhost:3001`.

> **Autenticação:** todos os endpoints de dados exigem `Authorization: Bearer <token>`.
> As únicas rotas públicas são `POST /auth/token` e `GET /health`. Sem token ou
> token expirado → `401`. A doc interativa (`GET /docs`, Swagger UI) fica atrás de
> HTTP Basic Auth (as mesmas credenciais do técnico).

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

`sem_dados` é separado de `sem_alertas` de propósito: c015 (saúde+educação+assistência todos `null`) não é o mesmo que uma criança verificada e sem alertas.

### `PATCH /children/:id/review`
Retorna a criança atualizada (`revisado: true`, `revisado_por` = email do JWT, `revisado_em` = ISO). 401 sem token, 404 se id não existe.

## Frontend

```
/           → /dashboard
/login      → form público; preserva `?next=`
/dashboard  → KPI cards + alertas/área + cobertura + distribuição por bairro (mapa/lista)
/children   → lista + filtros (URL-driven) + paginação
/children/[id] → 3 cards (saúde/educação/assistência) + ação de revisar
```

### Proteção de rotas
Duas camadas. A real é o **servidor**: a API exige `Bearer` em todo endpoint de dados (`preHandler: app.authenticate`), então nenhum dado sai sem token mesmo acessando a API direto. A do front é UX: o layout `(dashboard)/layout.tsx` lê o JWT do `localStorage`, decoda (sem verificar assinatura — quem verifica é o server), checa `exp` e, sem token ou expirado, manda pra `/login?next=<path>`. O `?next=` só aceita caminho interno (bloqueia open redirect).

O interceptor do Axios cobre o token expirando durante a sessão: qualquer 401 limpa storage e redireciona pra `/login?reason=expired`.

### Estado/cache
TanStack Query por feature (`useChildren`, `useSummary`, `useChild`, `useReviewChild`). `placeholderData: (prev) => prev` evita flash na paginação. A mutation de revisar atualiza o cache da criança e invalida lista + summary.

### Filtros na URL
`/children?bairro=Rocinha&alertas=com`. Compartilhável, voltar funciona, os cards do dashboard fazem drill-down direto com filtro.

### Responsividade e acessibilidade
Mobile-first, de 375px a 1440px, com header em hambúrguer abaixo de `md`. Landmarks (`<header>`/`<nav aria-label>`/`<main>`), inputs com `<Label htmlFor>` + `aria-invalid`/`aria-describedby`, status por área em ícone + cor + texto sr-only (não depende só de cor) e navegação por teclado coberta no Playwright. Dark mode via `next-themes` (modo `class`), com as CSS vars do shadcn ajustadas pra contraste WCAG AA.

## Casos-limite do seed

| Caso | Conteúdo | Como o painel mostra |
|---|---|---|
| c015 | Todas as 3 áreas `null` | 3 cards `EmptyArea` no detalhe; entra em `sem_dados` no summary (não em `sem_alertas`) |
| c005 | Só saúde | 1 card + 2 EmptyArea; row da lista com 1 verde + 2 cinzas |
| c004/c009/c023 | Sem saúde | Card de saúde vira EmptyArea |
| c011/c017 | `escola: null`, `frequencia_percent: null`, alerta `matricula_pendente` | Renderiza "Não informada" e `—`, com o alerta no bloco do campo |
| c014/c025 | Alertas nas 3 áreas | crítico na lista; no detalhe cada bloco de campo exibe o status do seu alerta |
| c025 | `cad_unico: false` **+** alerta `cadastro_desatualizado` (fontes divergentes) | precedência alerta > dado bruto: mostra só "Desatualizado", sem o "Ausente" contraditório (ver Decisões §8) |
| c012/c021 | Sem assistência social | Card específico vira EmptyArea |

A sinalização de problema em cada campo vem do alerta curado do domínio, não de um cálculo local — assim o card nunca contradiz a lista de alertas.

## Testes

```bash
npm test --workspaces                    # back (Vitest) + front (Vitest + RTL)
npm run test:e2e --workspace=apps/web    # Playwright (npx playwright install chromium 1x)
npm run typecheck --workspaces
```

- **Back:** auth (constant-time), filtros (acento-insensitive, composição), paginação, agregação do `/summary`, caminhos HTTP (200/400/401/404) via `inject()`, parse do seed, e o repositório Postgres num banco real via Testcontainers (auto-pula se o Docker não estiver disponível).
- **Front:** formatters (data, idade timezone-safe, JWT decode), precedência de status de campo (`resolveFieldStatus`), EmptyArea, KPI card, heatmap, cobertura e ReviewAction com mutation mock.
- **E2E:** redirect não-autenticado, login ok/erro, filtros, detalhe com 3 EmptyArea (c015), revisão com feedback, navegação por teclado, landmarks ARIA, layout a 375px sem overflow.

A listagem (filtro/ordenação/paginação) tem uma definição canônica em `domain/child-query.ts` — o `FakeChildrenStore` dos testes e o repositório Postgres compartilham essa mesma especificação.

## Decisões

### 1. Postgres como fonte única
Todos os dados vivem na tabela `children` (escalares em colunas, as áreas saúde/educação/assistência em `JSONB`, e as colunas de revisão). O `data/seed.json` carrega no **primeiro boot**, de forma idempotente — se a tabela já tem dados, não reescreve, então o que o técnico revisou sobrevive a reinícios.

`ChildrenStore` é uma interface (porta de persistência) com uma implementação de produção, `PostgresChildrenRepository`, onde filtro/ordenação/paginação rodam em SQL (`unaccent` pra busca sem acento, expressão JSONB pra contar alertas). Os testes injetam um `FakeChildrenStore` in-memory que reusa a mesma especificação de listagem (`domain/child-query.ts`), então não precisam de banco. As áreas viram `JSONB` em vez de tabelas próprias porque são read-only e sempre consumidas como o objeto inteiro — normalizar seria over-engineering.

O schema é versionado em migrations idempotentes (`repositories/migrations.ts`), aplicadas no boot e registradas numa tabela `schema_migrations`. Ficam embutidas no código (em vez de `.sql` soltos) pra evitar problemas de path no container.

### 2. Node + Fastify
Mesma stack do front, tipos do domínio alinhados, e Fastify entrega schema validation embutido. Go daria binário único e menos RAM, mas pra essa escala é imperceptível.

### 3. JWT em localStorage (vs cookie httpOnly)
Mais simples e adequado ao **deploy split** (web na Vercel, API no Render — domínios diferentes): cookie cross-site exigiria `SameSite=None; Secure` + CORS credenciado, justo o que os browsers vêm restringindo. O risco do localStorage é XSS, mitigado por zero HTML de input do usuário, escape default do React, ausência de `dangerouslySetInnerHTML` e CSP restritiva. Same-origin, o caminho seria cookie `HttpOnly; SameSite=Lax` + CSRF token.

### 4. Proteção client-side (vs middleware Next)
O token está no localStorage, que o middleware do Next não acessa. Trade-off: flash de spinner antes do redirect. Aceitável pra painel interno.

### 5. shadcn copiado vs lib instalada
Componentes em `src/components/ui/`, customização versionada, sem upgrade surpresa quebrar layout.

### 6. `output: standalone` no Next
Traça só o que é usado, então a imagem não carrega `node_modules` inteiro.

### 7. Config sensível em env (com defaults pro dev)
Os defaults da `docker-compose.yml` batem com o enunciado pra `docker compose up` funcionar sem setup. **Exceção: `JWT_SECRET` não tem default** — o entrypoint do container gera um aleatório quando ele vem vazio, e `loadEnv` recusa subir em produção se detectar o placeholder. Em prod, sobrescreve o resto via env no orchestrator.

### 8. Dados divergentes: um status por atributo (alerta > dado bruto)
O seed tem casos onde o dado bruto e o alerta curado discordam — ex.: c025 com `cad_unico: false` (cadastro ausente) **junto** do alerta `cadastro_desatualizado` (existe, mas vencido). O operador não quer lidar com "inconsistência entre sistemas"; quer um status acionável.

A regra: **o alerta tem precedência sobre o booleano** quando descrevem o mesmo atributo. O array `alertas` é a leitura curada do domínio; o booleano é o dado cru de um sistema. Cada bloco de campo mostra **um** status — do alerta quando há, ou do dado bruto quando não há. A lógica fica num helper puro e testado (`lib/field-status.ts`).

**Exceção: o medidor de frequência.** Ele **exibe o número e o mínimo** ("73% / 75% mínimo"), então a cor tem que concordar com o que está na tela — não pode ficar verde com 73 < 75 só porque o seed não trouxe o alerta `frequencia_baixa`. Aqui a cor segue a comparação visível (`value < min`).

## Segurança

- **Auth no servidor em todos os endpoints de dados** — só `POST /auth/token` e `GET /health` são públicos. A proteção não depende do front.
- **Rate limit** — global de 100 req/min e **5 req/min no `POST /auth/token`** (anti brute-force). Desligado em teste.
- **Comparação de credenciais em tempo constante** — evita timing attack no login.
- **Security headers** — CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` no front; `@fastify/helmet` na API.
- **`JWT_SECRET` nunca público** — gerado no entrypoint quando ausente; `loadEnv` recusa o placeholder em produção.
- **`/docs` atrás de HTTP Basic Auth** — o contrato não fica exposto sem credencial.
- **Validação com Zod no front e no back**; SQL parametrizado; `?next=` restrito a caminho interno.

Trade-offs conscientes (§3 e §4): token em `localStorage` e sem revogação (expiração de 1h) — proporcional a um painel interno de usuário único.

## Deploy

Configs prontas pra split deploy:
- **Vercel** (web): `apps/web/vercel.json`, região `gru1`
- **Render** (api): `render.yaml`, healthcheck em `/health`

Passos:
1. Render: novo Web Service a partir do `render.yaml` (provisiona o Postgres junto). Pega a URL pública.
2. Vercel: Import Project apontando pra `apps/web`. Define `NEXT_PUBLIC_API_URL` = URL da Render.
3. Volta no Render e define `CORS_ORIGIN` = URL pública do Vercel. Redeploy.

Não há deploy publicado nessa submissão; os configs estão prontos.

## O que faria diferente com mais tempo

1. Token em cookie httpOnly + middleware Next.js — elimina o flash de spinner.
2. Refresh token rotativo (hoje expira em 1h e força login).
3. CI no GitHub Actions: lint + typecheck + tests em PRs.
4. Tela dedicada de "Cobertura" listando casos sem dados, ordenada por nº de áreas faltantes.
5. Audit log das revisões.
6. Observabilidade: OpenTelemetry no back + Sentry no front.

## Histórico de commits

Histórico incremental (Conventional Commits) mostrando a evolução do setup → API → frontend → docker compose → deploy → docs.

```bash
git log --oneline
```
