import { z } from "zod";
import { ALERT_AREAS } from "./alerts.js";
import type { Child } from "./child.js";

export const alertFilterSchema = z.enum(["com", "sem", ...ALERT_AREAS]);
export type AlertFilter = z.infer<typeof alertFilterSchema>;

export const orderBySchema = z.enum([
  "nome",
  "bairro",
  "idade",
  "alertas",
  "revisao",
]);
export type OrderBy = z.infer<typeof orderBySchema>;

export const listChildrenQuerySchema = z.object({
  nome: z.string().trim().min(1).optional(),
  bairro: z.string().trim().min(1).optional(),
  alertas: alertFilterSchema.optional(),
  revisado: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  orderBy: orderBySchema.default("alertas"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type ListChildrenQuery = z.infer<typeof listChildrenQuerySchema>;

export interface ChildrenPage {
  items: Child[];
  total: number;
}
