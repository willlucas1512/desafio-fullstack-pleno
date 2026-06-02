import type { paths } from './api-schema';

/**
 * Tipos do domínio derivados do contrato OpenAPI da API (`api-schema.ts`, gerado
 * por `npm run gen:api-types`). Fonte única de verdade: os schemas Zod do
 * backend. Não edite à mão — ajuste a API e regenere. A CI falha se este arquivo
 * sair de sincronia com o `openapi.json`.
 */

type Json<T> = T extends { content: { 'application/json': infer B } } ? B : never;

// --- Entidades ---
export type Child = Json<paths['/children/{id}']['get']['responses']['200']>;
export type Prioridade = Child['prioridade'];
export type HealthInfo = NonNullable<Child['saude']>;
export type EducationInfo = NonNullable<Child['educacao']>;
export type SocialAssistanceInfo = NonNullable<Child['assistencia_social']>;

export type HealthAlert = HealthInfo['alertas'][number];
export type EducationAlert = EducationInfo['alertas'][number];
export type SocialAlert = SocialAssistanceInfo['alertas'][number];

// --- Listagem ---
export type ChildrenListResponse = Json<paths['/children']['get']['responses']['200']>;
export type Pagination = ChildrenListResponse['pagination'];

type ChildrenQuery = NonNullable<paths['/children']['get']['parameters']['query']>;
export type AlertFilter = NonNullable<ChildrenQuery['alertas']>;
export type OrderBy = NonNullable<ChildrenQuery['orderBy']>;

/**
 * Params usados pela UI. Espelha a query da API, mas `revisado` é booleano aqui
 * (a conversão pra string `'true'`/`'false'` acontece só na hora da requisição).
 */
export type ChildrenListParams = Omit<ChildrenQuery, 'revisado'> & { revisado?: boolean };

// --- Indicadores ---
export type Summary = Json<paths['/summary']['get']['responses']['200']>;
export type AlertsByArea = Summary['alertas_por_area'];
export type AlertArea = keyof AlertsByArea;
export type NeighborhoodSummary = Summary['por_bairro'][number];
export type Coverage = Summary['cobertura'];

// --- Auth / erros ---
export type AuthTokenResponse = Json<paths['/auth/token']['post']['responses']['200']>;
export type ApiErrorBody = Json<paths['/auth/token']['post']['responses']['400']>;
