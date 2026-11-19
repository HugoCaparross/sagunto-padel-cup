import { z } from "zod";
import { CATEGORIAS } from "@/lib/constantes";

export const esquemaCrearInscripcion = z.object({
    pruebaId: z.uuid(),
    categoria: z.enum(CATEGORIAS),
});

export const esquemaInscripcionId = z.object({
    inscripcionId: z.uuid(),
});