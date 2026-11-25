import { z } from "zod";
import { CATEGORIAS } from "@/lib/constantes";

const FECHA = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida");
const HORA = z.string().regex(/^\d{2}:\d{2}$/, "Hora no válida (HH:MM)");

export const esquemaCrearPrueba = z
    .object({
        nombre: z.string().trim().min(3, "El nombre es demasiado corto").max(80),
        slug: z
            .string()
            .trim()
            .min(3)
            .max(80)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug no válido")
            .optional(),
        fechaInicio: FECHA,
        fechaFin: FECHA,
        inscripcionesAbrenAt: z.iso.datetime({ offset: true }).nullable().optional(),
        inscripcionesCierranAt: z.iso.datetime({ offset: true }).nullable().optional(),
        horaInicio: HORA,
        horaFin: HORA,
        sede: z.string().trim().min(2, "Indica la sede").max(120),
        sedeUrl: z.url({ error: "URL no válida" }).max(500).nullish(),
        precioCentimos: z.number().int().min(0).max(100000),
        esMaster: z.boolean(),
        categorias: z.array(z.enum(CATEGORIAS)).min(1, "Elige al menos una categoría").max(4),
        plazasMaximas: z.number().int().min(3).max(200),
    })
    .refine((d) => d.fechaFin >= d.fechaInicio, {
        message: "La fecha de fin no puede ser anterior a la de inicio",
        path: ["fechaFin"],
    })
    .refine((d) => d.horaFin > d.horaInicio, {
        message: "La hora de fin debe ser posterior a la de inicio",
        path: ["horaFin"],
    })
    .refine((d) => {
        if (!d.inscripcionesAbrenAt || !d.inscripcionesCierranAt) return true;
        return Date.parse(d.inscripcionesCierranAt) > Date.parse(d.inscripcionesAbrenAt);
    }, {
        message: "El cierre debe ser posterior a la apertura",
        path: ["inscripcionesCierranAt"],
    })
    .refine((d) => {
        if (!d.inscripcionesAbrenAt || !d.inscripcionesCierranAt) return true;
        const localInicio = new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Europe/Madrid",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        }).format(new Date(d.inscripcionesCierranAt)).replace(" ", "T");
        return localInicio < `${d.fechaInicio}T${d.horaInicio}`;
    }, {
        message: "El cierre debe ser anterior al inicio de la prueba",
        path: ["inscripcionesCierranAt"],
    });
