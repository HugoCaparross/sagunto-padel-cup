import { z } from "zod";

export const esquemaDatosDeportivos = z.object({
    ladoPista: z.enum(["derecha", "izquierda", "ambos"]).nullable(),
    manoHabil: z.enum(["diestra", "zurda"]).nullable(),
    pala: z.string().trim().max(80).nullable(),
    otros: z
        .record(
            z.string().trim().min(1, "El nombre no puede estar vacío").max(40),
            z.string().trim().max(120)
        )
        .refine((o) => Object.keys(o).length <= 10, "Máximo 10 campos extra"),
});

export type DatosDeportivos = z.infer<typeof esquemaDatosDeportivos>;

export const DATOS_DEPORTIVOS_VACIOS: DatosDeportivos = {
    ladoPista: null,
    manoHabil: null,
    pala: null,
    otros: {},
};