import { z } from 'zod';

/** Formato padronizado de erro devolvido pelo error handler e pelos 404/401. */
export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  error: z.string(),
  message: z.string(),
  details: z.record(z.array(z.string())).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
