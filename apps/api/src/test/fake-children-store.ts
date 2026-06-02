import {
  countAlerts,
  hasAlertsIn,
  hasAnyAlert,
  hasEducationAlerts,
  hasHealthAlerts,
  hasNoAreaData,
  hasSocialAlerts,
  normalize,
} from "../domain/child-helpers.js";
import type { AlertArea } from "../domain/alerts.js";
import type {
  AlertFilter,
  ChildrenPage,
  ListChildrenQuery,
  OrderBy,
} from "../domain/child-query.js";
import type { Child } from "../domain/child.js";
import type { ReviewAction, ReviewAuditEntry } from "../domain/review-audit.js";
import type { Summary } from "../domain/summary.js";
import type { ChildrenStore } from "../repositories/children-store.js";

/**
 * Implementação in-memory de {@link ChildrenStore}, usada APENAS nos testes. É a
 * referência das regras de listagem/agregação.
 */
export class FakeChildrenStore implements ChildrenStore {
  private readonly byId: Map<string, Child>;
  private readonly order: string[];
  private readonly audit = new Map<string, ReviewAuditEntry[]>();

  constructor(initial: Child[]) {
    this.byId = new Map(initial.map((c) => [c.id, structuredClone(c)]));
    this.order = initial.map((c) => c.id);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async list(query: ListChildrenQuery): Promise<ChildrenPage> {
    const page = queryChildren(this.all(), query);
    return {
      items: page.items.map((c) => structuredClone(c)),
      total: page.total,
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async listAll(): Promise<Child[]> {
    return this.all().map((c) => structuredClone(c));
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async summary(): Promise<Summary> {
    return aggregate(this.all());
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async findById(id: string): Promise<Child | null> {
    const c = this.byId.get(id);
    return c ? structuredClone(c) : null;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async markReviewed(id: string, reviewedBy: string): Promise<Child | null> {
    const c = this.byId.get(id);
    if (!c) return null;
    if (c.revisado) return structuredClone(c); // idempotente: nada muda
    c.revisado = true;
    c.revisado_por = reviewedBy;
    c.revisado_em = new Date().toISOString();
    this.pushAudit(id, "revisado", reviewedBy);
    return structuredClone(c);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async unmarkReviewed(id: string): Promise<Child | null> {
    const c = this.byId.get(id);
    if (!c) return null;
    if (!c.revisado) return structuredClone(c); // idempotente: nada muda
    c.revisado = false;
    c.revisado_por = null;
    c.revisado_em = null;
    this.pushAudit(id, "revisao_desfeita", null);
    return structuredClone(c);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async reviewHistory(id: string): Promise<ReviewAuditEntry[]> {
    return [...(this.audit.get(id) ?? [])].reverse(); // mais recente primeiro
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async listNeighborhoods(): Promise<string[]> {
    return listNeighborhoods(this.all());
  }

  private pushAudit(
    id: string,
    action: ReviewAction,
    reviewer: string | null,
  ): void {
    const entries = this.audit.get(id) ?? [];
    entries.push({ action, reviewer, timestamp: new Date().toISOString() });
    this.audit.set(id, entries);
  }

  private all(): Child[] {
    return this.order
      .map((id) => this.byId.get(id))
      .filter((c): c is Child => c !== undefined);
  }
}

function queryChildren(all: Child[], q: ListChildrenQuery): ChildrenPage {
  const filtered = all.filter((child) => matchesFilters(child, q));
  const sorted = sortChildren(filtered, q.orderBy);
  const total = sorted.length;
  const start = (q.page - 1) * q.pageSize;
  return { items: sorted.slice(start, start + q.pageSize), total };
}

function matchesFilters(child: Child, q: ListChildrenQuery): boolean {
  if (q.nome && !normalize(child.nome).includes(normalize(q.nome)))
    return false;
  if (q.bairro && normalize(child.bairro) !== normalize(q.bairro)) return false;
  if (q.alertas !== undefined && !matchesAlertFilter(child, q.alertas))
    return false;
  if (q.revisado !== undefined && child.revisado !== q.revisado) return false;
  return true;
}

function matchesAlertFilter(child: Child, filter: AlertFilter): boolean {
  if (filter === "com") return hasAnyAlert(child);
  if (filter === "sem") return !hasAnyAlert(child);
  return hasAlertsIn(child, filter as AlertArea);
}

/** Comparação por code point (UTF-16). */
function byteCompare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const byName = (a: Child, b: Child): number =>
  byteCompare(normalize(a.nome), normalize(b.nome));
const byId = (a: Child, b: Child): number => byteCompare(a.id, b.id);

function sortChildren(children: Child[], orderBy: OrderBy): Child[] {
  // Todo critério termina com `byId` pra desempate estável idêntico ao SQL.
  return [...children].sort((a, b) => compareBy(orderBy, a, b) || byId(a, b));
}

function compareBy(orderBy: OrderBy, a: Child, b: Child): number {
  switch (orderBy) {
    case "nome":
      return byName(a, b);
    case "bairro":
      return (
        byteCompare(normalize(a.bairro), normalize(b.bairro)) || byName(a, b)
      );
    case "idade":
      // mais novo primeiro (data de nascimento mais recente)
      return byteCompare(b.data_nascimento, a.data_nascimento);
    case "revisao":
      // pendentes primeiro, depois revisado mais antigo (null = mais antigo)
      if (a.revisado !== b.revisado) return a.revisado ? 1 : -1;
      return byteCompare(a.revisado_em ?? "", b.revisado_em ?? "");
    case "alertas":
    default:
      // mais alertas primeiro; empate desfaz por nome
      return countAlerts(b) - countAlerts(a) || byName(a, b);
  }
}

/** Bairros distintos na mesma ordem da listagem. */
function listNeighborhoods(all: Child[]): string[] {
  return [...new Set(all.map((c) => c.bairro))].sort(
    (a, b) => byteCompare(normalize(a), normalize(b)) || byteCompare(a, b),
  );
}

function aggregate(children: Child[]): Summary {
  const total = children.length;
  let comAlertas = 0;
  let semDados = 0;
  let revisadas = 0;
  let alertasSaude = 0;
  let alertasEducacao = 0;
  let alertasSocial = 0;
  let comSaude = 0;
  let comEducacao = 0;
  let comSocial = 0;
  const porBairro = new Map<
    string,
    { total: number; com_alertas: number; sem_dados: number }
  >();

  for (const c of children) {
    const alerted = hasAnyAlert(c);
    const missingAll = hasNoAreaData(c);
    if (alerted) comAlertas++;
    if (missingAll) semDados++;
    if (c.revisado) revisadas++;
    if (hasHealthAlerts(c)) alertasSaude++;
    if (hasEducationAlerts(c)) alertasEducacao++;
    if (hasSocialAlerts(c)) alertasSocial++;
    if (c.saude !== null) comSaude++;
    if (c.educacao !== null) comEducacao++;
    if (c.assistencia_social !== null) comSocial++;

    const bucket = porBairro.get(c.bairro) ?? {
      total: 0,
      com_alertas: 0,
      sem_dados: 0,
    };
    bucket.total++;
    if (alerted) bucket.com_alertas++;
    if (missingAll) bucket.sem_dados++;
    porBairro.set(c.bairro, bucket);
  }

  return {
    total_criancas: total,
    com_alertas: comAlertas,
    sem_alertas: total - comAlertas - semDados,
    sem_dados: semDados,
    revisadas,
    pendentes_revisao: total - revisadas,
    alertas_por_area: {
      saude: alertasSaude,
      educacao: alertasEducacao,
      assistencia_social: alertasSocial,
    },
    por_bairro: [...porBairro.entries()]
      .map(([bairro, v]) => ({ bairro, ...v }))
      .sort((a, b) => {
        const na = normalize(a.bairro);
        const nb = normalize(b.bairro);
        if (na !== nb) return na < nb ? -1 : 1;
        return a.bairro < b.bairro ? -1 : a.bairro > b.bairro ? 1 : 0;
      }),
    cobertura: {
      com_saude: comSaude,
      com_educacao: comEducacao,
      com_assistencia_social: comSocial,
      sem_nenhuma_area: semDados,
    },
  };
}
