# Painel de Acompanhamento — PCRJ

Painel pra técnicos da Prefeitura acompanharem crianças em situação de vulnerabilidade social, cruzando dados de saúde, educação e assistência social. Monorepo com API Fastify + frontend Next.js.

> Submissão do desafio fullstack pleno.

## TL;DR

- **Demo no ar:** [painel-social-pcrj.vercel.app](https://painel-social-pcrj.vercel.app/) — loga com `tecnico@prefeitura.rio` / `painel@2024`. ([telas abaixo](#telas))
- **Subir local:** `docker compose up` → [localhost:3000](http://localhost:3000), mesmas credenciais.
- **Arquitetura:** monorepo API Fastify + web Next.js; auth via JWT em cookie `HttpOnly` atrás de um BFF (o token nunca toca o JS do browser).
- **Dado:** Postgres como fonte única (cada criança é um documento `JSONB`); filtro/ordenação/agregação rodam numa **única** definição de domínio em TypeScript, compartilhada entre testes e produção.
- **Diferencial:** trade-offs e decisões explicitados ([§Decisões](#decisões)), full test pyramid (Vitest + RTL + Playwright), acessibilidade WCAG AA, dark mode, configs de deploy split (Vercel + Render).

## Índice

- [Telas](#telas) · [Quickstart](#quickstart) · [Stack](#stack) · [Rodando sem Docker](#rodando-local-sem-docker)
- [API](#api) · [Frontend](#frontend) · [Casos-limite do seed](#casos-limite-do-seed) · [Testes](#testes)
- [Decisões](#decisões) · [Segurança](#segurança) · [Deploy](#deploy) · [O que faria diferente](#o-que-faria-diferente-com-mais-tempo)

## Telas

> Ao vivo em [painel-social-pcrj.vercel.app](https://painel-social-pcrj.vercel.app/).

| Login | Dashboard |
|---|---|
| ![Tela de login](docs/screenshot-login.webp) | ![Dashboard com KPIs, alertas por área e cobertura](docs/screenshot-dashboard.webp) |
| Split institucional PCRJ + form acessível (VLibras, foco visível). | KPIs, alertas por área e cobertura — `sem_dados` destacado à parte de `sem_alertas`. |

| Distribuição por bairro | Lista de crianças |
|---|---|
| ![Heatmap de bairros com lacunas de cobertura](docs/screenshot-dashboard-mapa.webp) | ![Lista com busca, filtros e ordenação](docs/screenshot-lista.webp) |
| Heatmap por intensidade de alertas; listras marcam lacuna de cobertura; clique filtra a lista. | Busca, filtros URL-driven, ordenação e badges de alerta por área. |

| Detalhe da criança (caso crítico c025) |
|---|
| ![Detalhe de Valentina Cruz Nogueira com alertas nas 3 áreas](docs/screenshot-detalhe.webp) |
| Os 3 cards por área. Mostra a precedência alerta > dado bruto (CadÚnico "Desatualizado") e a exceção do medidor de frequência (48% < 75% pinta vermelho) — ver [Decisões §8](#8-dados-divergentes-um-status-por-atributo-alerta--dado-bruto). |

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
| Auth | `@fastify/jwt` HS256 + BFF no Next (cookie httpOnly) | JWT na API; o web guarda o token num cookie httpOnly e proxia same-origin (§3) |
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

### Auth: BFF com cookie httpOnly

```
                  cookie HttpOnly (token)
        ┌──────────────────────────────────────┐
        │                                       ▼
┌───────────────┐   same-origin   ┌──────────────────────┐   server-to-server   ┌─────────────┐
│    Browser    │ ──────────────► │  Next (BFF)           │ ───────────────────► │  API        │
│  (sem token)  │  /api/auth/*    │  Route Handlers       │  injeta Bearer       │  Fastify    │
│               │  /api/proxy/*   │  + proxy [...path]     │  (lê cookie)         │  verifica   │
└───────────────┘ ◄────────────── │  + middleware (edge)  │ ◄─────────────────── │  assinatura │
                    HTML/JSON      └──────────────────────┘     JSON / 401        └─────────────┘
```

O token **nunca** chega ao JavaScript do browser. O login posta em `POST /api/auth/login` (Route Handler do Next), que repassa as credenciais à API, recebe o JWT e o grava num cookie `HttpOnly; SameSite=Lax; Secure` (em prod). As chamadas de dados passam pelo proxy same-origin `/api/proxy/[...path]`, que lê o cookie no servidor e injeta o `Authorization: Bearer` antes de falar com a API — o browser só vê requisições same-origin, sem token exposto a XSS.

Proteção de rotas em duas camadas. A real continua no **servidor**: a API exige `Bearer` em todo endpoint de dados (`preHandler: app.authenticate`), então nenhum dado sai sem token. No front, o `middleware.ts` (edge) roda antes de renderizar: decoda o cookie (sem verificar assinatura — quem verifica é a API), checa `exp` e, em rota protegida sem sessão válida, redireciona pra `/login?next=<path>` antes de qualquer flash de tela. O `?next=` só aceita caminho interno (bloqueia open redirect); logado, `/login` redireciona pro dashboard.

O proxy cobre o token expirando no meio da sessão: qualquer 401 da API limpa o cookie, e o interceptor do Axios manda pra `/login?reason=expired`.

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

- **Back:** auth (constant-time), filtros (acento-insensitive, composição), paginação, agregação do `/summary`, caminhos HTTP (200/400/401/404) via `inject()`, parse do seed, e o repositório Postgres num banco real via Testcontainers. A suíte de Postgres cobre o **I/O**: seed idempotente, persistência das mutações de revisão e o round-trip de mapeamento (`JSONB`/timestamp → domínio), confirmando que o caminho real devolve o mesmo resultado da definição canônica em memória. Fora de CI, pula sem Docker; **em CI (`process.env.CI`) falha alto** se o Docker não estiver disponível, pra nunca dar verde sem exercitar o caminho de produção.
- **Front:** formatters (data, idade timezone-safe, JWT decode), precedência de status de campo (`resolveFieldStatus`), EmptyArea, KPI card, heatmap, cobertura e ReviewAction com mutation mock.
- **E2E:** redirect não-autenticado, login ok/erro, filtros, detalhe com 3 EmptyArea (c015), revisão com feedback, navegação por teclado, landmarks ARIA, layout a 375px sem overflow.

A listagem (filtro/ordenação/paginação) e a agregação do `/summary` têm uma **única implementação** em `domain/` — tanto o `FakeChildrenStore` dos testes quanto o `PostgresChildrenRepository` de produção carregam as crianças e delegam a ela. Não há lógica de negócio duplicada em SQL pra divergir.

## Decisões

### 1. Postgres como fonte única
Todos os dados vivem na tabela `children`, onde cada criança é **um documento `JSONB`** (`id` + `data`). O `data/seed.json` carrega no **primeiro boot**, de forma idempotente — se a tabela já tem dados, não reescreve, então o que o técnico revisou sobrevive a reinícios.

`ChildrenStore` é uma interface (porta de persistência) com uma implementação de produção, `PostgresChildrenRepository`. O banco é a fonte de **durabilidade**: guarda o estado e persiste as revisões. Filtro, ordenação, paginação e agregação **não** rodam em SQL — o repositório carrega as crianças e delega à definição única do domínio (`domain/child-query.ts`, `domain/summary.ts`), a mesma lógica que o `FakeChildrenStore` dos testes usa (por isso o fake é um substituto fiel por construção, não por testes de paridade). Como o conjunto é pequeno e read-mostly (25 crianças no seed), processar em memória é trivial e mantém a regra de negócio num lugar só — TypeScript testável, sem espelhar nada em SQL e sem o risco de drift entre as duas linguagens. Persistir a criança inteira como um único `JSONB` (em vez de coluna por campo) faz do schema Zod (`domain/child.ts`) a **única** definição do registro: adicionar um campo ou área é uma mudança só no domínio, sem tocar DDL, `INSERT` ou mapeamento de linha. Toda leitura revalida com `childSchema.parse`, então o banco nunca devolve um formato fora do contrato.

O schema é versionado em migrations idempotentes (`repositories/migrations.ts`), aplicadas no boot e registradas numa tabela `schema_migrations`. Ficam embutidas no código (em vez de `.sql` soltos) pra evitar problemas de path no container.

**Escala — trade-off consciente.** Carregar tudo em memória é certo nesta ordem de grandeza (dezenas/centenas de registros), mas `por_bairro` e `listNeighborhoods` fazem full scan: num cenário de 25k+ crianças isso pesaria. A porta `ChildrenStore` é exatamente o ponto de virada — quando o volume justificar, basta uma segunda implementação que empurre filtro/ordenação/paginação/agregação pra SQL (com índices em `bairro`/`revisado`), sem tocar services, rotas nem as regras do domínio. A decisão de não fazer isso agora é deliberada: evita SQL espelhando o TypeScript (e o drift que vem junto) antes de existir um problema real de performance.

### 2. Node + Fastify
Mesma stack do front, tipos do domínio alinhados, e Fastify entrega schema validation embutido. Go daria binário único e menos RAM, mas pra essa escala é imperceptível.

### 3. BFF no Next com cookie httpOnly (vs JWT no localStorage)
O JWT vive num cookie `HttpOnly; SameSite=Lax; Secure`, fora do alcance do JavaScript — imune a roubo por XSS. O browser nunca fala com a API direto: os Route Handlers (`/api/auth/*`) e o proxy `/api/proxy/[...path]` são o **BFF**, que lê o cookie no servidor e injeta o `Bearer`. Isso resolve o atrito do **deploy split** (web na Vercel, API no Render): como o BFF é same-origin com o web, o cookie é first-party (`SameSite=Lax`, sem `None`/CORS credenciado) e a API só recebe chamadas server-to-server. Custo: um hop extra de rede por request — desprezível pra um painel interno, e o ganho de segurança compensa.

### 4. Proteção server-side via middleware Next (vs client-side)
O cookie é legível no edge, então o `middleware.ts` decoda e decide o redirect **antes** de renderizar — sem flash de spinner. Decoda só pra UX (lê `exp`); a verificação de assinatura continua na API, a cada chamada proxiada, evitando acoplar o secret do JWT ao web no deploy split.

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

### 9. Tipos do front gerados do contrato OpenAPI
Em vez de redeclarar os tipos de resposta no front (que silenciosamente divergiriam do back), o front os **deriva do contrato**. `npm run gen:api-types` boota a API, extrai o OpenAPI (`apps/api/openapi.json`) e roda `openapi-typescript`, gerando `apps/web/src/lib/api-schema.ts`; `lib/types.ts` indexa esse schema (`paths['/children/{id}']['get']...`) pra expor `Child`, `Summary`, etc. Os dois artefatos são commitados, e o **CI regenera e roda `git diff --exit-code`** — se alguém mexer no schema da API sem regenerar, o build quebra. Não virou pacote compartilhado de propósito: cada `Dockerfile` só copia o seu `apps/<x>`, então um workspace comum quebraria os builds do deploy split.

## Segurança

- **Auth no servidor em todos os endpoints de dados** — só `POST /auth/token` e `GET /health` são públicos. A proteção não depende do front.
- **JWT em cookie `HttpOnly` via BFF** — o token nunca chega ao JavaScript do browser; impossível roubar por XSS. As chamadas passam pelo proxy same-origin, que injeta o `Bearer` no servidor (ver Decisões §3).
- **Rate limit** — global de 100 req/min e **5 req/min no `POST /auth/token`** (anti brute-force). Desligado em teste.
- **Comparação de credenciais em tempo constante** — `crypto.timingSafeEqual` sobre o SHA-256 das credenciais (comprimento fixo, sem vazar tamanho), evita timing attack no login.
- **Security headers** — CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` no front; `@fastify/helmet` na API com CSP restritiva (só `/docs` afrouxa `script-src`/`style-src` pra `unsafe-inline`, o resto fica em `default-src 'self'`).
- **`JWT_SECRET` nunca público** — gerado no entrypoint quando ausente; `loadEnv` recusa o placeholder em produção.
- **`/docs` atrás de HTTP Basic Auth** — o contrato não fica exposto sem credencial.
- **Validação com Zod no front e no back**; SQL parametrizado; `?next=` restrito a caminho interno.

Trade-off consciente: sem revogação de token (expiração de 1h) — proporcional a um painel interno de usuário único.

### CSP enfraquecida pelo VLibras (trade-off conhecido)

O widget de acessibilidade VLibras (player Unity) injeta scripts inline e cria Web Workers a partir de URLs `blob:`, o que **obriga** o `script-src` do front a incluir `'unsafe-inline'` e `'unsafe-eval'` (ver `apps/web/next.config.mjs`). Isso enfraquece a CSP como camada de defesa contra XSS — embora o risco fique mitigado por React escapar a saída por padrão, pela ausência de `dangerouslySetInnerHTML` com dados de usuário e, principalmente, pelo JWT viver num cookie `HttpOnly` fora do alcance do JavaScript (um XSS não conseguiria roubar a sessão).

**Com mais tempo, isolaria o VLibras num `<iframe>` sandboxed de origem própria**, servindo o widget num documento separado com sua própria CSP permissiva. Assim o resto da aplicação voltaria a uma CSP estrita (sem `'unsafe-inline'`/`'unsafe-eval'` no `script-src`), confinando o relaxamento ao iframe do widget. As demais correções da auditoria (HSTS explícito no `next.config.mjs`, rate limit compartilhado via Redis ao escalar réplicas) seriam aplicadas no mesmo esforço — foram conscientemente adiadas por estarem fora do escopo essencial do desafio.

## Deploy

**No ar:** web em [painel-social-pcrj.vercel.app](https://painel-social-pcrj.vercel.app/) (Vercel) consumindo a API no Render via BFF.

Split deploy:
- **Vercel** (web): `apps/web/vercel.json`, região `gru1`
- **Render** (api): `render.yaml`, healthcheck em `/health`

Passos pra reproduzir:
1. Render: novo Web Service a partir do `render.yaml` (provisiona o Postgres junto). Pega a URL pública.
2. Vercel: Import Project apontando pra `apps/web`. Define `API_URL` = URL da Render (server-only; o BFF a consome, o browser nunca).
3. Volta no Render e define `CORS_ORIGIN` = URL pública do Vercel. Redeploy.

## O que faria diferente com mais tempo

1. Refresh token rotativo (hoje expira em 1h e força login).
2. Isolar o VLibras num `<iframe>` sandboxed pra restaurar uma CSP estrita no resto do app (remover `'unsafe-inline'`/`'unsafe-eval'` do `script-src` — ver Segurança).
3. HSTS explícito no `next.config.mjs` e rate limit compartilhado (Redis) pra escalar réplicas.
4. **Otimizar a entrega pra aparelhos fracos** (a persona é técnico em campo, muitas vezes em dispositivo simples e rede instável, acessando várias vezes ao dia). Hoje o dashboard carrega Recharts e o mapa SVG (com o GeoJSON inline) estaticamente no bundle do cliente, e as telas são 100% client components. Com mais tempo: `next/dynamic` no gráfico e no mapa (com fallback de skeleton) pra tirá-los do bundle inicial, mover o path do GeoJSON pra um asset/módulo separado, e usar RSC pra renderizar a primeira carga da lista/dashboard no servidor (melhor TTFB e first-paint, em vez de skeleton → fetch no browser). Mediria com bundle analyzer + Lighthouse mobile (CPU/rede throttled) pra guiar os cortes.
5. Tela dedicada de "Cobertura" listando casos sem dados, ordenada por nº de áreas faltantes.
6. Audit log das revisões.
7. Observabilidade: OpenTelemetry no back + Sentry no front.

## Histórico de commits

Histórico incremental (Conventional Commits) mostrando a evolução do setup → API → frontend → docker compose → deploy → docs.

```bash
git log --oneline
```
