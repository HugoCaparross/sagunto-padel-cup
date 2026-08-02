// Ruta: src/lib/validations/resultado.ts
import { z } from "zod";

export const setSchema = z.object({
  juegos_pair1: z.number().int().min(0).max(20),
  juegos_pair2: z.number().int().min(0).max(20),
  tiebreak: z.boolean(),
  tiebreak_pair1: z.number().int().min(0).optional(),
  tiebreak_pair2: z.number().int().min(0).optional(),
});

export const resultadoSchema = z.object({
  sets: z.array(setSchema).min(1, { message: "Añade al menos un set" }),
});
export type ResultadoFormValues = z.infer<typeof resultadoSchema>;