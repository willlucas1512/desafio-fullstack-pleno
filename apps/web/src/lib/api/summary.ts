import type { Summary } from '../types';
import { apiClient } from './client';

export async function getSummary(): Promise<Summary> {
  const { data } = await apiClient.get<Summary>('/summary');
  return data;
}
