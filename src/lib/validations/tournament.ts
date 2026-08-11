// Ruta: src/lib/validations/tournament.ts

import { z } from "zod";

export const tournamentSchema =
  z
    .object({
      nombre: z
        .string()
        .trim()
        .min(3, {
          message:
            "Introduce un nombre",
        })
        .max(150, {
          message:
            "El nombre es demasiado largo",
        }),

      fecha_inicio: z
        .string()
        .min(1, {
          message:
            "Fecha de inicio requerida",
        }),

      fecha_fin: z
        .string()
        .min(1, {
          message:
            "Fecha de fin requerida",
        }),
    })
    .superRefine(
      (
        values,
        ctx
      ) => {
        const inicio =
          new Date(
            `${values.fecha_inicio}T00:00:00`
          );

        const fin =
          new Date(
            `${values.fecha_fin}T00:00:00`
          );

        if (
          Number.isNaN(
            inicio.getTime()
          ) ||
          Number.isNaN(
            fin.getTime()
          )
        ) {
          return;
        }

        if (fin < inicio) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "fecha_fin",
            ],
            message:
              "La fecha de fin no puede ser anterior a la fecha de inicio.",
          });
        }
      }
    );

export type TournamentFormValues =
  z.infer<
    typeof tournamentSchema
  >;