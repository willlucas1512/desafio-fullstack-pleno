import { AREA_LABEL } from "@/lib/format";
import type { AlertFilter, OrderBy } from "@/lib/types";

export const ANY = "__all__";

export const ALERT_OPTIONS: { value: AlertFilter; label: string }[] = [
  { value: "com", label: "Com algum alerta" },
  { value: "sem", label: "Sem alertas" },
  { value: "saude", label: `Alerta em ${AREA_LABEL.saude.toLowerCase()}` },
  {
    value: "educacao",
    label: `Alerta em ${AREA_LABEL.educacao.toLowerCase()}`,
  },
  {
    value: "assistencia_social",
    label: `Alerta em ${AREA_LABEL.assistencia_social.toLowerCase()}`,
  },
];

export const ORDER_OPTIONS: { value: OrderBy; label: string }[] = [
  { value: "alertas", label: "Mais alertas" },
  { value: "nome", label: "Nome (A-Z)" },
  { value: "bairro", label: "Bairro" },
  { value: "idade", label: "Mais novo" },
  { value: "revisao", label: "Pendentes primeiro" },
];
