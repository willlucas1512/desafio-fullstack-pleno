export type HealthAlert = 'vacinas_atrasadas' | 'consulta_atrasada';
export type EducationAlert = 'frequencia_baixa' | 'matricula_pendente';
export type SocialAlert = 'cadastro_ausente' | 'cadastro_desatualizado' | 'beneficio_suspenso';
export type AlertArea = 'saude' | 'educacao' | 'assistencia_social';

export interface HealthInfo {
  ultima_consulta: string | null;
  vacinas_em_dia: boolean;
  alertas: HealthAlert[];
}

export interface EducationInfo {
  escola: string | null;
  frequencia_percent: number | null;
  alertas: EducationAlert[];
}

export interface SocialAssistanceInfo {
  cad_unico: boolean;
  beneficio_ativo: boolean;
  alertas: SocialAlert[];
}

export interface Child {
  id: string;
  nome: string;
  data_nascimento: string;
  bairro: string;
  responsavel: string;
  saude: HealthInfo | null;
  educacao: EducationInfo | null;
  assistencia_social: SocialAssistanceInfo | null;
  revisado: boolean;
  revisado_por: string | null;
  revisado_em: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ChildrenListResponse {
  items: Child[];
  pagination: Pagination;
}

export type AlertFilter = 'com' | 'sem' | AlertArea;

export interface ChildrenListParams {
  bairro?: string;
  alertas?: AlertFilter;
  revisado?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AlertsByArea {
  saude: number;
  educacao: number;
  assistencia_social: number;
}

export interface NeighborhoodSummary {
  bairro: string;
  total: number;
  com_alertas: number;
  sem_dados: number;
}

export interface Coverage {
  com_saude: number;
  com_educacao: number;
  com_assistencia_social: number;
  sem_nenhuma_area: number;
}

export interface Summary {
  total_criancas: number;
  com_alertas: number;
  sem_alertas: number;
  sem_dados: number;
  revisadas: number;
  pendentes_revisao: number;
  alertas_por_area: AlertsByArea;
  por_bairro: NeighborhoodSummary[];
  cobertura: Coverage;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, string[]>;
}
