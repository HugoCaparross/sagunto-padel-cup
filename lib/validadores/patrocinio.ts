import { z } from "zod";
import { CATEGORIAS, CUADROS } from "@/lib/constantes";

export const TIPOS_PATROCINADOR = ["institucional", "comercial"] as const;

export const esquemaPatrocinador = z.object({
    id: z.uuid().optional(),
    nombre: z.string().trim().min(2, "Escribe el nombre").max(120),
    logoUrl: z.url({ error: "URL del logo no válida" }).max(500),
    webUrl: z.url({ error: "URL de la web no válida" }).max(500).nullable(),
    tipo: z.enum(TIPOS_PATROCINADOR),
});

export const esquemaActivo = z.object({
    id: z.uuid(),
    activo: z.boolean(),
});

export const esquemaAsignacion = z.object({
    pruebaId: z.uuid(),
    patrocinadorId: z.uuid(),
    asignar: z.boolean(),
});

export const esquemaPremio = z.object({
    pruebaId: z.uuid(),
    categoria: z.enum(CATEGORIAS),
    cuadro: z.enum(CUADROS),
    descripcion: z.string().trim().min(3, "Describe el premio").max(300),
    revelarEl: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida")
        .nullable(),
});

export const esquemaEliminarPremio = z.object({
    id: z.uuid(),
    motivo: z.string().trim().min(10, "El motivo debe tener al menos 10 caracteres").max(500),
});