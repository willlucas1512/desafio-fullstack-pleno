# Desafio Técnico — Full-stack Pleno

## Contexto

A Prefeitura acompanha crianças em situação de vulnerabilidade social cruzando informações de três áreas: saúde, educação e assistência social. Os técnicos de campo precisam de um painel para identificar rapidamente quais crianças têm alertas ativos — vacinas atrasadas, frequência escolar baixa, benefícios suspensos — e registrar o acompanhamento realizado.

Sua tarefa é construir esse painel do zero: backend, frontend e a integração entre os dois.

---

## O que construir

### Backend

Uma API que serve os dados das crianças acompanhadas. O repositório inclui `data/seed.json` com 25 crianças fictícias — você decide como carregá-los e armazená-los, mas a decisão deve estar documentada.

**Endpoints necessários:**

- `POST /auth/token` — autentica um técnico e retorna um JWT. Credenciais de teste: `a@b.test` / `x`
- `GET /children` — lista crianças com suporte a filtros (bairro, presença de alertas, status de revisão) e paginação
- `GET /children/:id` — detalhe completo de uma criança
- `GET /summary` — agrega os dados para o painel: total de crianças, quantas têm alertas por área, quantas já foram revisadas
- `PATCH /children/:id/review` — registra que o técnico autenticado revisou o caso (requer JWT)

Os paths acima são sugestão. O JWT gerado deve conter o campo `preferred_username` com o e-mail do técnico autenticado.

### Frontend (Next.js + TypeScript)

Um painel funcional que consome essa API. Esperamos encontrar:

- **Login** com proteção de rotas e redirecionamento automático quando o JWT expirar
- **Dashboard** com cards de resumo a partir do `GET /summary`
- **Lista de crianças** com filtros funcionais (bairro, alertas, status de revisão) e paginação
- **Detalhe da criança** mostrando o status nas três áreas (saúde, educação, assistência social)
- **Ação de marcar como revisado** via `PATCH /children/:id/review` com feedback visual

Um ponto importante: nem todas as crianças têm dados nas três áreas — algumas aparecem só na saúde, outras têm dados de educação e assistência social mas não de saúde. O painel precisa lidar com esses casos de forma útil, não só deixar o campo em branco.

Pense em quem vai usar isso: um técnico de campo que acessa o painel várias vezes ao dia, muitas vezes num celular ou num computador mais simples. Interface responsiva de 375px a 1440px.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Go 1.24+ (Gin) ou Node.js — justifique a escolha |
| Frontend | Next.js 14+ com TypeScript (App Router) |
| Estilização | Tailwind CSS — ou justifique outra escolha |
| Infraestrutura | Docker — `docker compose up` tem que subir tudo do zero |

Bibliotecas de componentes, clientes HTTP e outras dependências são escolha sua — documente o raciocínio.

---

## Entregáveis

1. **Repositório Git público** com histórico de commits que mostre como o trabalho evoluiu
2. **`docker compose up`** deve subir a aplicação completa sem configuração adicional
3. **README atualizado** cobrindo:
   - Como rodar o projeto localmente
   - Decisões arquiteturais e trade-offs
   - Credenciais de teste
   - O que faria diferente com mais tempo
4. **Envio**: responda ao e-mail de convite com o link do repositório (ou deploy público)

> Queremos conseguir abrir `http://localhost:3000`, fazer login, usar o painel e entender o que está acontecendo — sem precisar perguntar nada.

---

## O que avaliamos

- Qualidade do código e organização do projeto
- Clareza e consistência na construção da API e integração entre frontend e backend
- Boas práticas de desenvolvimento (clean code, componentização, modularidade)
- Tratamento de dados, incluindo cenários com informações incompletas ou inconsistentes
- Usabilidade, responsividade e clareza da interface, especialmente em contextos reais de uso
- Gestão de estado e comunicação eficiente com a API
- Segurança básica da aplicação (autenticação e proteção de rotas)
- Documentação e capacidade de comunicar decisões e trade-offs

Os dados do seed têm casos-limite intencionais — crianças sem dados em nenhum sistema, com alertas em todas as áreas ao mesmo tempo, com dados parciais. Como o sistema se comporta nesses casos é parte do que avaliamos.

---

## Diferenciais

Não são obrigatórios, mas agregam:

- **shadcn/ui**: uso da biblioteca de componentes no frontend
- **Testes**: unitários no backend, de componente no frontend, E2E com Playwright
- **Acessibilidade**: navegação por teclado, ARIA labels, contraste adequado (WCAG AA)
- **Deploy publicado**: URL acessível sem configuração local (Vercel + Render, Railway ou equivalente)
- **Visualizações**: gráficos sobre os dados agregados, mapa de calor por bairro
- **Dark mode**

---

Dúvidas: **selecao.pcrj@gmail.com**
