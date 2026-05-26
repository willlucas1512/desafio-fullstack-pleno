'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getChild,
  listChildren,
  listNeighborhoods,
  reviewChild,
} from '@/lib/api/children';
import type { Child, ChildrenListParams } from '@/lib/types';

export function useChildren(params: ChildrenListParams) {
  return useQuery({
    queryKey: ['children', params],
    queryFn: () => listChildren(params),
    placeholderData: (previous) => previous,
  });
}

export function useChild(id: string) {
  return useQuery({
    queryKey: ['child', id],
    queryFn: () => getChild(id),
    enabled: Boolean(id),
  });
}

export function useNeighborhoods() {
  return useQuery({
    queryKey: ['neighborhoods'],
    queryFn: listNeighborhoods,
    staleTime: 5 * 60_000,
  });
}

export function useReviewChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewChild(id),
    onSuccess: (updated: Child) => {
      qc.setQueryData(['child', updated.id], updated);
      qc.invalidateQueries({ queryKey: ['children'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      toast.success(`Caso de ${updated.nome.split(' ')[0]} marcado como revisado.`);
    },
    onError: () => {
      toast.error('Não foi possível registrar a revisão. Tente novamente.');
    },
  });
}
