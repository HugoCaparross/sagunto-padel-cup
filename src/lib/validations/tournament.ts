// Ruta: src/lib/validations/tournament.ts
import { z } from "zod";

export const tournamentSchema = z.object({
  nombre: z.string().min(3, { message: "Introduce un nombre" }),
  fecha_inicio: z.string().min(1, { message: "Fecha de inicio requerida" }),
  fecha_fin: z.string().min(1, { message: "Fecha de fin requerida" }),
});
export type TournamentFormValues = z.infer<typeof tournamentSchema>;