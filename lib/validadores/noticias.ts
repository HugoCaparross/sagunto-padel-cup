import { z } from "zod";

export const CATEGORIAS_NOTICIA = [
    "circuito",
    "resultados",
    "inscripciones",
    "general",
] as const;

export type CategoriaNoticia = (typeof CATEGORIAS_NOTICIA)[number];

export const ETIQUETAS_NOTICIA: Record<CategoriaNoticia, string> = {
    circuito: "Circuito",
    resultados: "Resultados",
    inscripciones: "Inscripciones",
    general: "General",
};

const SLUG = z
    .string()
    .trim()
    .min(3, "El slug es demasiado corto")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug no válido: solo minúsculas, números y guiones");

const CAMPOS = {
    titulo: z.string().trim().min(5, "El título es demasiado corto").max(140),
    resumen: z.string().trim().min(10, "El resumen es demasiado corto").max(300),
    contenido: z.string().trim().min(20, "El contenido es demasiado corto").max(50000),
    categoria: z.enum(CATEGORIAS_NOTICIA),
    imagenUrl: z.url({ error: "URL no válida" }).max(500).nullish(),
};

export const esquemaCrearNoticia = z.object({
    ...CAMPOS,
    slug: SLUG.optional(),
    publicar: z.boolean(),
});

export const esquemaEditarNoticia = z.object({
    id: z.uuid(),
    ...CAMPOS,
    slug: SLUG,
});

export const esquemaPublicacion = z.object({
    id: z.uuid(),
    publicada: z.boolean(),
});

export const esquemaEliminarNoticia = z.object({
    id: z.uuid(),
    motivo: z
        .string()
        .trim()
        .min(10, "El motivo debe tener al menos 10 caracteres")
        .max(500),
});

export const esquemaSlug = z.object({
    slug: SLUG,
});