'use client';

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getChild,
  listChildren,
  listNeighborhoods,
  reviewChild,
  unreviewChild,
} from '@/lib/api/children';
import type { Child, ChildrenListParams } from '@/lib/types';

/** Propaga o estado atualizado da criança pra todos os caches relevantes. */
function applyChildUpdate(qc: QueryClient, updated: Child) {
  qc.setQueryData(['child', updated.id], updated);
  qc.invalidateQueries({ queryKey: ['children'] });
  qc.invalidateQueries({ queryKey: ['summary'] });
}

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
  // mutação de desfazer usada pela ação "Desfazer" do toast (recuperação de clique acidental)
  const undo = useMutation({
    mutationFn: (id: string) => unreviewChild(id),
    onSuccess: (updated: Child) => applyChildUpdate(qc, updated),
  });

  return useMutation({
    mutationFn: (id: string) => reviewChild(id),
    onSuccess: (updated: Child) => {
      applyChildUpdate(qc, updated);
      toast.success(`Caso de ${updated.nome.split(' ')[0]} marcado como revisado.`, {
        action: {
          label: 'Desfazer',
          onClick: () => undo.mutate(updated.id),
        },
      });
    },
    onError: () => {
      toast.error('Não foi possível registrar a revisão. Tente novamente.');
    },
  });
}

export function useUnreviewChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unreviewChild(id),
    onSuccess: (updated: Child) => {
      applyChildUpdate(qc, updated);
      toast.success(`Revisão de ${updated.nome.split(' ')[0]} desfeita.`);
    },
    onError: () => {
      toast.error('Não foi possível desfazer a revisão. Tente novamente.');
    },
  });
}
