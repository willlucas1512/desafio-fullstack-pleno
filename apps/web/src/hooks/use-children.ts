"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOptionalAuth } from "@/hooks/use-auth";
import {
  getChild,
  listChildren,
  listNeighborhoods,
  reviewChild,
  unreviewChild,
} from "@/lib/api/children";
import { NEIGHBORHOODS_STALE_TIME_MS } from "@/lib/constants";
import type {
  Child,
  ChildrenListParams,
  ChildrenListResponse,
} from "@/lib/types";

/** Aplica a revisão otimista numa entidade (espelha o que o servidor fará). */
function withReview(reviewed: boolean, reviewer: string | null) {
  return (child: Child): Child =>
    reviewed
      ? {
          ...child,
          revisado: true,
          revisado_por: reviewer,
          revisado_em: new Date().toISOString(),
        }
      : { ...child, revisado: false, revisado_por: null, revisado_em: null };
}

interface ReviewHandlers {
  onSuccess?: (updated: Child) => void;
  onError?: () => void;
}

function useReviewMutation(reviewed: boolean, handlers?: ReviewHandlers) {
  const qc = useQueryClient();
  const reviewer = useOptionalAuth()?.user?.preferred_username ?? null;

  return useMutation({
    mutationFn: (id: string) =>
      reviewed ? reviewChild(id) : unreviewChild(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["child", id] });
      await qc.cancelQueries({ queryKey: ["children"] });

      const patch = withReview(reviewed, reviewer);
      const prevChild = qc.getQueryData<Child>(["child", id]);
      const prevLists = qc.getQueriesData<ChildrenListResponse>({
        queryKey: ["children"],
      });

      if (prevChild) qc.setQueryData<Child>(["child", id], patch(prevChild));
      qc.setQueriesData<ChildrenListResponse>(
        { queryKey: ["children"] },
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((c) => (c.id === id ? patch(c) : c)),
              }
            : old,
      );

      return { prevChild, prevLists };
    },
    onError: (_error, id, ctx) => {
      if (ctx?.prevChild) qc.setQueryData(["child", id], ctx.prevChild);
      ctx?.prevLists.forEach(([key, data]) => qc.setQueryData(key, data));
      handlers?.onError?.();
    },
    onSuccess: (updated: Child) => {
      qc.setQueryData(["child", updated.id], updated);
      handlers?.onSuccess?.(updated);
    },
    onSettled: (_data, _error, id) => {
      qc.invalidateQueries({ queryKey: ["child", id] });
      qc.invalidateQueries({ queryKey: ["children"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useChildren(params: ChildrenListParams) {
  return useQuery({
    queryKey: ["children", params],
    queryFn: () => listChildren(params),
    placeholderData: (previous) => previous,
  });
}

export function useChild(id: string) {
  return useQuery({
    queryKey: ["child", id],
    queryFn: () => getChild(id),
    enabled: Boolean(id),
  });
}

export function useNeighborhoods() {
  return useQuery({
    queryKey: ["neighborhoods"],
    queryFn: listNeighborhoods,
    staleTime: NEIGHBORHOODS_STALE_TIME_MS,
  });
}

export function useReviewChild() {
  // mutação de desfazer usada pela ação "Desfazer" do toast (recuperação de clique acidental)
  const undo = useReviewMutation(false);

  return useReviewMutation(true, {
    onSuccess: (updated) => {
      toast.success(
        `Caso de ${updated.nome.split(" ")[0]} marcado como revisado.`,
        {
          action: {
            label: "Desfazer",
            onClick: () => undo.mutate(updated.id),
          },
        },
      );
    },
    onError: () => {
      toast.error("Não foi possível registrar a revisão. Tente novamente.");
    },
  });
}

export function useUnreviewChild() {
  return useReviewMutation(false, {
    onSuccess: (updated) => {
      toast.success(`Revisão de ${updated.nome.split(" ")[0]} desfeita.`);
    },
    onError: () => {
      toast.error("Não foi possível desfazer a revisão. Tente novamente.");
    },
  });
}
