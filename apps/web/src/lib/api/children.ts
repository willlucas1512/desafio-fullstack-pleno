import type { Child, ChildrenListParams, ChildrenListResponse } from '../types';
import { apiClient } from './client';

export async function listChildren(params: ChildrenListParams): Promise<ChildrenListResponse> {
  const { data } = await apiClient.get<ChildrenListResponse>('/children', {
    params: serialize(params),
  });
  return data;
}

export async function getChild(id: string): Promise<Child> {
  const { data } = await apiClient.get<Child>(`/children/${encodeURIComponent(id)}`);
  return data;
}

export async function reviewChild(id: string): Promise<Child> {
  const { data } = await apiClient.patch<Child>(`/children/${encodeURIComponent(id)}/review`);
  return data;
}

export async function listNeighborhoods(): Promise<string[]> {
  const { data } = await apiClient.get<{ bairros: string[] }>('/children/neighborhoods');
  return data.bairros;
}

function serialize(params: ChildrenListParams): Record<string, string | number | undefined> {
  const out: Record<string, string | number | undefined> = {};
  if (params.bairro) out.bairro = params.bairro;
  if (params.alertas) out.alertas = params.alertas;
  if (params.revisado !== undefined) out.revisado = String(params.revisado);
  if (params.page !== undefined) out.page = params.page;
  if (params.pageSize !== undefined) out.pageSize = params.pageSize;
  return out;
}
