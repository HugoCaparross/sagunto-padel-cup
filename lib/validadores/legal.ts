import { z } from "zod";
import { TIPOS_DOCUMENTO } from "@/lib/legal/requisitos";

export const TIPOS_CONSENTIMIENTO = [
    "privacidad",
    "imagen",
    "cookies_analitica",
    "comunicaciones",
    "mayoria_o_tutor",
] as const;

export type TipoConsentimiento = (typeof TIPOS_CONSENTIMIENTO)[number];

export const esquemaTipoDocumento = z.enum(TIPOS_DOCUMENTO);

export const esquemaCrearVersion = z.object({
    tipo: esquemaTipoDocumento,
    titulo: z.string().trim().min(5, "El título es demasiado corto").max(160),
    contenido: z
        .string()
        .trim()
        .min(200, "Un documento legal necesita un contenido completo")
        .max(200000),
});

export const esquemaPublicarVersion = z.object({
    id: z.uuid(),
});

export const esquemaConsentimiento = z.object({
    tipo: z.enum(TIPOS_CONSENTIMIENTO),
    concedido: z.boolean(),
    documentoId: z.uuid().optional(),
});