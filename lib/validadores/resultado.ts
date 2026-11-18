import { z } from "zod";
import { CATEGORIAS, CUADROS, RONDAS } from "@/lib/constantes";

const juegos = z.number().int().min(0).max(99);

// Un set debe tener ganador. El super tie-break de la final se guarda como tercer set, p. ej. [10, 8].
const esquemaSet = z
    .tuple([juegos, juegos])
    .refine(([a, b]) => a !== b, "Un set no puede terminar empatado");

export const esquemaResultadoPartido = z.object({
    partidoId: z.uuid(),
    sets: z.array(esquemaSet).min(1).max(3),
    motivo: z.string().trim().min(10).max(500).optional(),
});

export const esquemaPosicionFinal = z.object({
    pruebaId: z.uuid(),
    inscripcionId: z.uuid(),
    categoria: z.enum(CATEGORIAS),
    cuadro: z.enum(CUADROS),
    ronda: z.enum(RONDAS),
    motivo: z.string().trim().min(10).max(500).optional(),
});