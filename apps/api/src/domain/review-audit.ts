import { z } from "zod";

/** Ações auditáveis sobre a revisão de um caso. */
export const reviewActionSchema = z.enum(["revisado", "revisao_desfeita"]);
export type ReviewAction = z.infer<typeof reviewActionSchema>;

/**
 * Entrada da trilha de auditoria (append-only): registra quem fez o quê e quando
 * a cada transição.
 */
export const reviewAuditEntrySchema = z.object({
  action: reviewActionSchema,
  reviewer: z.string().nullable(),
  timestamp: z.string().datetime(),
});
export type ReviewAuditEntry = z.infer<typeof reviewAuditEntrySchema>;

/** Resposta do endpoint de histórico de revisão (mais recente primeiro). */
export const reviewHistorySchema = z.object({
  items: z.array(reviewAuditEntrySchema),
});
export type ReviewHistory = z.infer<typeof reviewHistorySchema>;
