import { z } from "zod";

export const TIPOS_CONTACTO = ["consulta", "sugerencia"] as const;
export type TipoContacto = (typeof TIPOS_CONTACTO)[number];

export const ESTADOS_CONTACTO = [
    "nueva",
    "en_curso",
    "respondida",
    "archivada",
] as const;
export type EstadoContacto = (typeof ESTADOS_CONTACTO)[number];

export const ETIQUETAS_ESTADO_CONTACTO: Record<EstadoContacto, string> = {
    nueva: "Nueva",
    en_curso: "En curso",
    respondida: "Respondida",
    archivada: "Archivada",
};

export const esquemaContacto = z.object({
    tipo: z.enum(TIPOS_CONTACTO),
    nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
    email: z.email({ error: "Email no válido" }).max(254),
    mensaje: z
        .string()
        .trim()
        .min(10, "El mensaje es demasiado corto")
        .max(2000, "El mensaje es demasiado largo"),
    consentimiento: z.literal(true, {
        error: "Debes aceptar la política de privacidad",
    }),
    // Campo trampa: las personas no lo rellenan, los bots sí. Se comprueba en la acción.
    web: z.string().optional(),
});

export const esquemaFiltroContacto = z.object({
    estado: z.enum(ESTADOS_CONTACTO).optional(),
});

export const esquemaActualizarContacto = z.object({
    id: z.uuid(),
    estado: z.enum(ESTADOS_CONTACTO).optional(),
    notasInternas: z.string().trim().max(2000).nullable().optional(),
});