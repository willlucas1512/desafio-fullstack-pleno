# Painel de Acompanhamento — PCRJ

Painel para técnicos da Prefeitura acompanharem crianças em situação de vulnerabilidade social, cruzando dados de **saúde**, **educação** e **assistência social**. Backend em Node.js (Fastify) + frontend em Next.js, em monorepo, com `docker compose up` rodando tudo do zero.

> **Submissão do desafio técnico fullstack pleno — PCRJ.**

---

## ⚡ Quickstart

```bash
git clone https://github.com/willlucas1512/desafio-fullstack-pleno.git
cd desafio-fullstack-pleno

# Configure a API (credenciais e JWT_SECRET) — veja "Credenciais de teste"
cp apps/api/.env.example apps/api/.env
# edite apps/api/.env: preencha TECHNICIAN_EMAIL, TECHNICIAN_PASSWORD e JWT_SECRET

docker compose up
```

Acesse **http://localhost:3000** e faça login com as [credenciais de teste](#credenciais-de-teste).

> Se a porta 3000 ou 3001 já estiver em uso no seu ambiente, defina `WEB_HOST_PORT=3010` ou `API_HOST_PORT=3011` antes do comando (mais detalhes em [Variáveis de ambiente](#variáveis-de-ambiente)).

---

## 🧭 Sumário

- [Stack](#stack)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Rodando localmente](#rodando-localmente)
- [API](#api)
- [Frontend](#frontend)
- [Testes](#testes)
- [Decisões arquiteturais e trade-offs](#decisões-arquiteturais-e-trade-offs)
- [Tratamento dos casos-limite do seed](#tratamento-dos-casos-limite-do-seed)
- [Deploy](#deploy)
- [Credenciais de teste](#credenciais-de-teste)
- [O que eu faria com mais tempo](#o-que-eu-faria-com-mais-tempo)

---

## Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Backend** | Node.js 22 + TypeScript + **Fastify 4** | Schema de validação integrado, ~2× mais rápido que Express, tipos compartilháveis com o front |
| **Auth** | `@fastify/jwt` (HS256) | Padrão da indústria, integra com o ecossistema Fastify |
| **Persistência** | In-memory (carregado de `data/seed.json` no boot) | 25 registros, escritas escopadas à sessão — adicionar Postgres seria over-engineering. Veja [Decisões](#1-persistência-in-memory-sem-banco-de-dados) |
| **Frontend** | Next.js 15 (App Router) + React 18 + TypeScript | Especificado pelo desafio |
| **UI** | Tailwind CSS + **shadcn/ui** + lucide-react | Componentes copiados (não instalados) — controle total sobre customização |
| **Estado servidor** | TanStack Query v5 | Cache automático, refetch, optimistic UI |
| **Formulários** | react-hook-form + Zod | Mesma stack do back para tipagem consistente |
| **Gráficos** | Recharts | Curva de aprendizado curta, responsivo nativo |
| **Toasts** | Sonner | Sem provider boilerplate, animações suaves |
| **Tema** | next-themes (claro/escuro/sistema) | |
| **Testes back** | Vitest + Fastify `inject()` | Unit + integration HTTP sem overhead de network |
| **Testes front** | Vitest + Testing Library | Mesmo runner do back, jsdom |
| **E2E** | Playwright | Chromium + suporte a a11y via locators semânticos |
| **Infra** | Docker Compose multi-stage | Imagens de runtime ~120 MB cada, usuário não-root |

---

## Estrutura do repositório

```
desafio-fullstack-pleno/
├── apps/
│   ├── api/                 # Backend Fastify
│   │   ├── src/
│   │   │   ├── config/      # Carregamento e validação de env (Zod)
│   │   │   ├── domain/      # Schemas + helpers do domínio (Child, alertas)
│   │   │   ├── repositories/# Repositório in-memory que hidrata do seed.json
│   │   │   ├── services/    # AuthService, ChildrenService, SummaryService
│   │   │   ├── routes/      # Rotas HTTP (auth, children, summary)
│   │   │   ├── plugins/     # JWT plugin + authenticate preHandler
│   │   │   ├── app.ts       # Composição da aplicação (injetável p/ testes)
│   │   │   └── server.ts    # Bootstrap + graceful shutdown
│   │   └── Dockerfile
│   └── web/                 # Frontend Next.js 15
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/login/      # Rota pública
│       │   │   └── (dashboard)/       # Rotas protegidas (layout guard)
│       │   ├── components/
│       │   │   ├── ui/                # Primitives shadcn (button, card, etc.)
│       │   │   ├── status/            # Badges, dots, EmptyArea
│       │   │   ├── dashboard/         # KPI cards, charts, heatmap
│       │   │   ├── children/          # List row, filters, area cards
│       │   │   └── layout/            # AppHeader
│       │   ├── hooks/                 # useAuth, useChildren, useSummary
│       │   ├── lib/
│       │   │   ├── api/               # Axios client + endpoints
│       │   │   ├── auth/              # Token storage + JWT decode
│       │   │   ├── types.ts           # Espelha o contrato da API
│       │   │   └── format.ts          # Datas, idade, labels PT-BR
│       │   └── providers/             # Query + Theme + Toaster
│       ├── tests/e2e/                 # Playwright
│       └── Dockerfile
├── data/
│   └── seed.json            # 25 crianças (fornecido no desafio)
├── docker-compose.yml       # Orquestração local (api + web)
├── render.yaml              # Deploy da API no Render
└── apps/web/vercel.json     # Deploy do frontend no Vercel
```

---

## Rodando localmente

### Pré-requisitos

- **Docker** + **Docker Compose** (recomendado) **ou**
- Node.js **≥ 20** + npm 10+

### Opção 1 — Docker Compose (recomendado)

```bash
# 1. Crie o arquivo de configuração da API a partir do template:
cp apps/api/.env.example apps/api/.env

# 2. Edite apps/api/.env e preencha:
#    - TECHNICIAN_EMAIL e TECHNICIAN_PASSWORD (valores do enunciado — veja
#      "Credenciais de teste" abaixo)
#    - JWT_SECRET (qualquer string ≥ 16 chars; gere uma com:
#      node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 3. Suba a stack:
docker compose up --build
```

- API em http://localhost:3001
- Web em http://localhost:3000
- A API só fica disponível para o web depois que `/health` retornar 200 (via `depends_on.condition: service_healthy`).

> **Por que esse passo de configuração?** Runtime config (credenciais e segredos) vive em `.env`, não no código — segue [12-factor app](https://12factor.net/config) e permite trocar valores por ambiente sem rebuild. Veja a [decisão #8](#8-configuração-de-runtime-fora-do-código).

### Opção 2 — Node nativo

```bash
# 1. Instale tudo (npm workspaces)
npm install

# 2. Configure a API (mesmo passo do Docker Compose)
cp apps/api/.env.example apps/api/.env
# edite apps/api/.env conforme acima

# 3. Em dois terminais:
npm run dev:api   # API em http://localhost:3001
npm run dev:web   # Web em http://localhost:3000
```

### Variáveis de ambiente

Copie `.env.example` na raiz para `.env` e ajuste se necessário. As mais relevantes:

| Variável | Default | Onde é usada |
|---|---|---|
| `JWT_SECRET` | _(obrigatório)_ | API — assinatura HS256. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `JWT_EXPIRES_IN` | `1h` | API — validade do token |
| `TECHNICIAN_EMAIL` / `TECHNICIAN_PASSWORD` | _(obrigatórios)_ | API — credenciais aceitas. Use os valores do enunciado do desafio. Lidos exclusivamente do `.env` (ver [decisão #8](#8-configuração-de-runtime-fora-do-código)). |
| `CORS_ORIGIN` | `http://localhost:3000` | API — origem permitida (lista por vírgula) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Web — URL da API (browser-side, embedada no build) |
| `API_HOST_PORT` | `3001` | Compose — porta exposta no host |
| `WEB_HOST_PORT` | `3000` | Compose — porta exposta no host |

---

## API

Base URL: `http://localhost:3001`

### `POST /auth/token`

```http
POST /auth/token
Content-Type: application/json

{ "email": "<TECHNICIAN_EMAIL>", "password": "<TECHNICIAN_PASSWORD>" }
```

→ `200`
```json
{ "access_token": "eyJhbGciOi...", "token_type": "Bearer" }
```

→ `401` quando email/senha inválidos. → `400` quando o payload não passa na validação (Zod retorna `details` por campo).

O JWT inclui o claim `preferred_username` com o e-mail do técnico autenticado (conforme exigido pelo enunciado).

### `GET /children`

Query params (todos opcionais):

| Param | Tipo | Descrição |
|---|---|---|
| `bairro` | string | Comparação acento- e case-insensitive (`maré` = `MARÉ` = `mare`) |
| `alertas` | `com` \| `sem` \| `saude` \| `educacao` \| `assistencia_social` | Filtra por presença de alertas (geral ou por área) |
| `revisado` | `true` \| `false` | Status de revisão |
| `page` | int ≥ 1 | Default 1 |
| `pageSize` | int 1..100 | Default 10 |

→ `200`
```json
{
  "items": [{ "id": "c001", "nome": "...", "saude": { ... } | null, ... }],
  "pagination": { "page": 1, "pageSize": 10, "total": 25, "totalPages": 3 }
}
```

### `GET /children/:id`

→ `200` com a criança completa. `404` se não encontrada.

### `GET /children/neighborhoods`

→ `{ "bairros": ["Complexo do Alemão", "Jacarezinho", ...] }` (ordenado alfabeticamente — usado pelo filtro do front).

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
  "cobertura": {
    "com_saude": 23,
    "com_educacao": 20,
    "com_assistencia_social": 21,
    "sem_nenhuma_area": 1
  }
}
```

**Por que `sem_dados` é separado de `sem_alertas`:** uma criança com `saude=null, educacao=null, assistencia_social=null` (c015 no seed) **não é o mesmo que** uma criança verificada e sem alertas. A primeira indica uma lacuna de cobertura cadastral; a segunda, um caso saudável. O painel trata as duas situações diferentemente — e o sumário expõe ambas separadamente.

### `PATCH /children/:id/review`

**Requer autenticação.** Header: `Authorization: Bearer <token>`.

→ `200` com a criança atualizada (`revisado: true`, `revisado_por` = email do JWT, `revisado_em` = ISO atual).

→ `401` sem token / token expirado. `404` se `id` não existe.

---

## Frontend

### Fluxo

```
/        → redireciona para /dashboard
/login   → form (público); redireciona para /dashboard ao autenticar (ou para ?next=... preservado)
/dashboard         (protegido) → KPI cards + gráficos + mapa por bairro
/children          (protegido) → lista paginada + filtros (URL-driven)
/children/[id]    (protegido) → cards de saúde/educação/assistência + ação de revisão
```

### Proteção de rotas

O layout `(dashboard)/layout.tsx` é o **único ponto de proteção**:

1. Lê o JWT do `localStorage` no mount.
2. Decodifica o payload (sem validar assinatura — server faz isso) e checa `exp`.
3. Se ausente/expirado, redireciona para `/login?next=<caminho-original>` (preserva intenção de navegação).
4. Enquanto valida, mostra um spinner em vez de "piscar" conteúdo protegido.

O interceptor do Axios cuida do caso em que o token **expira durante a sessão**: qualquer `401` do servidor limpa o storage e força redirect com `?reason=expired`, que dispara uma mensagem amigável no login.

### Estado / cache

- **TanStack Query** isola fetching das telas. Cada hook (`useChildren`, `useSummary`, `useChild`) é uma feature à parte.
- `placeholderData: (prev) => prev` na lista evita o "flash" durante a paginação.
- A mutation de revisão (`useReviewChild`) atualiza o cache da criança individual e invalida list+summary — sem precisar de refetch manual.

### Filtros e URL

Filtros da lista vivem na **query string** (`/children?bairro=Rocinha&alertas=com`). Consequências:

- Links são compartilháveis (técnico pode mandar um WhatsApp com o filtro).
- O botão "voltar" do navegador funciona como esperado.
- Os cards do dashboard linkam diretamente para listas filtradas (drill-down).

### Responsividade

Mobile-first. Testado dos 375 px aos 1440 px. Header tem menu hambúrguer abaixo de `md`. Gráficos do dashboard reflowam em uma coluna no mobile. Cards da lista mostram tudo que importa sem rolagem horizontal.

### Acessibilidade

- `lang="pt-BR"` no `<html>`.
- Landmarks: `<header>`, `<nav aria-label>`, `<main>`.
- Inputs com `<Label htmlFor>`, `aria-invalid`, `aria-describedby` apontando para as mensagens de erro.
- Botões e badges com `aria-label` ou `sr-only` quando o ícone é a única pista visual.
- Status por área (em dia / com alerta / sem dados) é codificado em **ícone + cor + texto sr-only** — não depende só de cor.
- Navegação por teclado verificada nos specs Playwright (`a11y.spec.ts`).

### Dark mode

`next-themes` em modo `class`, com toggle no header (Claro / Escuro / Sistema). As CSS variables do shadcn/ui foram ajustadas em `globals.css` para um par light/dark com bom contraste.

---

## Testes

| Tipo | Onde | Comando |
|---|---|---|
| Unit + integration HTTP (back) | `apps/api/src/**/*.test.ts` | `npm test --workspace=apps/api` |
| Component + helpers (front) | `apps/web/src/**/*.test.ts(x)` | `npm test --workspace=apps/web` |
| E2E (Playwright) | `apps/web/tests/e2e/` | `npm run test:e2e --workspace=apps/web` |
| Type-check | — | `npm run typecheck --workspaces` |

**Antes de rodar os E2E pela primeira vez:**
```bash
npx playwright install --with-deps chromium
```

Os specs Playwright sobem API e Web automaticamente via `webServer` no `playwright.config.ts`.

### Cobertura atual

- **Back:** 47 testes — auth (comparação constant-time), filtros (acento-insensível, combinação), paginação (incluindo página fora do range), agregação do `/summary`, todos os caminhos HTTP (200/400/401/404) com `inject()`, parsing do seed real.
- **Front:** 31 testes — formatadores (data, idade timezone-safe, JWT decode), badges de status, três estados de área (em dia / com alerta / sem dados), EmptyArea, stat card, neighborhood heatmap, coverage card, ReviewAction com mutation mock.
- **E2E:** 8 specs — redirect quando não autenticado, login OK/erro, filtros da lista, detalhe de criança com `EmptyArea` em todas as áreas (c015), revisão com feedback, navegação por teclado no login, landmarks ARIA no dashboard.

---

## Decisões arquiteturais e trade-offs

### 1. Persistência in-memory (sem banco de dados)

**O que:** o repositório lê `data/seed.json` no boot e mantém os registros num `Map`. A mutation `PATCH /review` atualiza apenas a memória — reinicia o container, volta ao estado original do seed.

**Por quê:** o desafio explicitamente permite essa escolha desde que documentada. Adicionar Postgres/SQLite para 25 registros e uma única mutation **adicionaria mais código sem agregar valor** ao que está sendo avaliado (qualidade de domínio, integração front-back, casos-limite do seed).

**Trade-off:** revisões são perdidas no restart. Em produção real eu adicionaria um SQLite local ou uma tabela `reviews` (apenas o estado mutável) em Postgres. O `ChildrenRepository` já é uma classe — basta uma segunda implementação `PgChildrenRepository` para trocar.

### 2. Node + Fastify (em vez de Go + Gin)

**Por quê:**
- Tipos do domínio podem ser **conceitualmente alinhados** entre back e front (mesmo Zod-style validation, mesmas convenções de naming).
- Ecossistema mais coeso para um stack onde o front já é Node/TS.
- Fastify entrega validação por schema, OpenAPI-ready e ~2× a performance do Express — ganho concreto sobre o default mais popular.

**Trade-off:** Go entregaria binário único de runtime e menor uso de memória. Para 25 registros e poucas RPS, a diferença é imperceptível.

### 3. JWT no `localStorage` (em vez de cookie httpOnly)

**Por quê:** mais simples (sem CSRF, sem dance de cookie/CORS) e suficiente para um painel SPA. Documentado em [`storage.ts`](apps/web/src/lib/auth/storage.ts).

**Trade-off:** vulnerável a XSS se houver. Mitigado por (a) zero HTML injetado a partir de input do usuário, (b) escape default do React, (c) ausência de `dangerouslySetInnerHTML`. Para produção com dados sensíveis, eu trocaria por cookie `HttpOnly; SameSite=Lax` + token CSRF em rotas mutáveis.

### 4. Proteção de rotas no cliente (em vez de middleware do Next)

**Por quê:** o token está no `localStorage`, que não é acessível pelo middleware do Next (que roda na edge / no servidor). Manter a proteção client-side é coerente com o token storage.

**Trade-off:** há um "flash" de spinner antes do redirect. Aceitável para um painel interno; em produção pública eu mudaria para cookie httpOnly + middleware do Next.

### 5. Filtros na URL (em vez de no estado React)

**Por quê:** links compartilháveis, botão "voltar" funcionando, drill-down dos cards do dashboard apontando diretamente para listas filtradas. URL é a **fonte da verdade** — o componente só lê e despacha mudanças.

**Trade-off:** cada mudança de filtro re-renderiza via roteador. Negligível com TanStack Query (`placeholderData` mantém a UI estável).

### 6. shadcn/ui (em vez de uma lib instalada como dep)

**Por quê:** componentes são **copiados** para `src/components/ui/`, não importados de `node_modules`. Customizações ficam no repo e versionadas; não há upgrade surpresa quebrando o layout.

**Trade-off:** updates manuais. Para esse desafio, é zero custo.

### 7. `output: 'standalone'` no Next

Imagem Docker final do web é ~150 MB porque inclui só o que o tracer do Next identificou como necessário. Sem essa flag, copiaríamos `.next` + `node_modules` inteiros (~600 MB).

### 8. Configuração de runtime fora do código

**O que:** todas as variáveis sensíveis (`TECHNICIAN_EMAIL`, `TECHNICIAN_PASSWORD`, `JWT_SECRET`) são lidas exclusivamente de variáveis de ambiente — sem defaults no schema Zod ([`env.ts`](apps/api/src/config/env.ts)), no `docker-compose.yml` ou no `render.yaml`. O `apps/api/.env.example` documenta a estrutura esperada; o operador copia para `apps/api/.env` e preenche os valores antes de subir a stack. Os testes ficam totalmente isolados, com fixtures próprios (`SAMPLE_EMAIL` / `SAMPLE_VALUE`) que não compartilham nenhum valor com configuração de deploy.

**Por quê:** runtime configuration deve sair do código-fonte por princípio (12-factor app, fator III). Cada ambiente — dev/staging/prod — tem o seu próprio `.env` sem precisar de branch ou build diferentes; rotacionar uma credencial não requer commit; e testes não acoplam suas asserções a valores que podem mudar fora deles.

**Trade-off:** `docker compose up` deixa de ser 100% "zero config" — exige um `cp apps/api/.env.example apps/api/.env` + preenchimento dos valores antes do primeiro start. O custo é uma etapa de setup, documentada no Quickstart; o ganho é desacoplar completamente código de configuração.

---

## Tratamento dos casos-limite do seed

O seed tem casos intencionalmente complicados. Aqui está o que o painel faz em cada um:

| Caso (seed) | O que tem | Como o painel mostra |
|---|---|---|
| **c015** | Saúde, educação e assistência **todos null** | Detalhe: 3 cards `EmptyArea` explicando "sem dados … verificar cobertura cadastral". Listagem: row sem pontos de status acesos. Summary: conta em `sem_dados` (não em `sem_alertas`) |
| **c005** | Só saúde (outras null) | Detalhe: card de saúde + 2 `EmptyArea`. Row na lista: 1 ponto verde + 2 cinzas |
| **c004, c009, c023** | Sem saúde, com educação e/ou assistência | Card de saúde substituído por `EmptyArea` |
| **c011, c017** | `educacao.escola === null` e `frequencia_percent === null` com alerta `matricula_pendente` | Card de educação renderiza "Não informada" para escola e `—` para frequência, mas exibe o alerta |
| **c014, c025** | Alertas nas três áreas simultaneamente | Listagem: 3 pontos vermelhos; detalhe: 3 cards com badges de alerta visíveis |
| **c012, c021** | Sem `assistencia_social` | Card específico vira `EmptyArea` |

### Frequência baixa abaixo de 75%

Renderizada em vermelho (`text-destructive`) no detalhe — pista visual extra quando o número está crítico mas ainda informado.

---

## Deploy

Configurações prontas para um deploy "split":
- **Frontend** no Vercel (`apps/web/vercel.json`) — região `gru1` (São Paulo).
- **Backend** no Render (`render.yaml`) — imagem Docker, healthcheck em `/health`.

**Passos:**

1. **Render (API):**
   - `New Web Service → From Git Repo → Use existing render.yaml`.
   - Após o primeiro deploy, copie a URL pública (algo como `https://painel-api-xxxx.onrender.com`).

2. **Vercel (Web):**
   - `Import Project` apontando para `apps/web` no monorepo.
   - Defina o env var `NEXT_PUBLIC_API_URL` para a URL da API do Render.
   - Vercel detecta o `vercel.json` e o monorepo automaticamente.

3. **CORS:**
   - Volte no Render e defina `CORS_ORIGIN` = URL pública do front (Vercel).
   - Redeploy.

> Não publiquei o deploy nessa submissão porque exigiria credenciais de Vercel/Render que não posso configurar pelo CLI no seu lugar; os configs estão prontos para você apertar "deploy".

---

## Credenciais de teste

As credenciais aceitas pela API são as **publicadas no enunciado público do desafio**, na seção *"Endpoints necessários → POST /auth/token"* do repositório [`prefeitura-rio/desafio-fullstack-pleno`](https://github.com/prefeitura-rio/desafio-fullstack-pleno#readme).

Para usá-las, coloque os valores em `apps/api/.env` (variáveis `TECHNICIAN_EMAIL` e `TECHNICIAN_PASSWORD`). Veja a [decisão #8](#8-configuração-de-runtime-fora-do-código) sobre por que toda config sensível mora em `.env`.

A senha é validada com **comparação constant-time** ([`auth.service.ts`](apps/api/src/services/auth.service.ts)) para evitar timing attacks.

---

## O que eu faria com mais tempo

1. **Persistência real para `revisado`.** Um SQLite local (ou Postgres) só para guardar a tabela `reviews` (e mover a fonte da verdade das outras áreas para tabelas separadas em algum momento). O `ChildrenRepository` já é uma classe; é um swap.
2. **Token em cookie httpOnly.** Resolve o ponto de XSS e ainda permite usar Next middleware para proteção de rotas server-side — elimina o "flash" de spinner.
3. **Refresh token.** Hoje a sessão expira em 1h e o usuário precisa logar de novo. Um refresh token rotativo (sliding window) seria a próxima parada.
4. **CI no GitHub Actions.** Lint + typecheck + tests (back, front, Playwright) em PRs. O setup está pronto — falta o `.github/workflows/ci.yml`.
5. **Tela de "Cobertura"** dedicada. Hoje a informação "X crianças sem dados em alguma área" aparece no dashboard; com mais tempo eu faria uma tela específica priorizando os casos onde a equipe deve atuar primeiro (ordenando por nº de áreas faltantes).
6. **Audit log das revisões.** Se a revisão é um evento operacionalmente relevante, faz sentido manter o histórico (`reviews` como event log, com `revisado_em`, `revisado_por`, e talvez uma nota livre).
7. **i18n.** Atualmente está hard-coded em PT-BR. Se houver outro idioma no roadmap, o `ALERT_LABEL` em [`format.ts`](apps/web/src/lib/format.ts) é o ponto natural de extração.
8. **Mapa geográfico real** para o heatmap, com shapes dos bairros do Rio (ex.: leaflet + GeoJSON da PCRJ). Hoje o heatmap é categórico (cards coloridos por intensidade) — funciona, mas um mapa de verdade comunica melhor para quem está em campo.
9. **Storybook** com os componentes de status e cards. Útil pra alinhar com designer / acessibilidade.
10. **Observabilidade:** OpenTelemetry no back + Sentry no front. Em produção, sem isso fica difícil entender o que está quebrando.

---

## Histórico de commits

Por ser uma submissão técnica, o histórico foi mantido **incremental** (26 commits, padrão Conventional Commits) para mostrar a evolução do trabalho: scaffold → API (com testes) → frontend (com testes) → docker compose → deploy → docs.

```bash
git log --oneline
```
