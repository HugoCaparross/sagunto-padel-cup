import { z } from "zod";
import { TALLAS } from "@/lib/validadores/auth";

export const esquemaActualizarPerfil = z.object({
    nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
    tallaCamiseta: z.enum(TALLAS).nullable(),
    visibilidadPublica: z.boolean(),
    consentimientoImagen: z.boolean(),
});