// Ruta: src/lib/validations/resultado.ts

import { z } from "zod";

export const setSchema =
  z
    .object({
      juegos_pair1: z
        .number()
        .int()
        .min(0)
        .max(20),

      juegos_pair2: z
        .number()
        .int()
        .min(0)
        .max(20),

      tiebreak:
        z.boolean(),

      tiebreak_pair1:
        z
          .number()
          .int()
          .min(0)
          .max(30)
          .optional(),

      tiebreak_pair2:
        z
          .number()
          .int()
          .min(0)
          .max(30)
          .optional(),
    })
    .superRefine(
      (set, ctx) => {
        if (
          !set.tiebreak
        ) {
          return;
        }

        if (
          set.tiebreak_pair1 ===
          undefined
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "tiebreak_pair1",
            ],
            message:
              "Introduce el resultado del tiebreak.",
          });
        }

        if (
          set.tiebreak_pair2 ===
          undefined
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "tiebreak_pair2",
            ],
            message:
              "Introduce el resultado del tiebreak.",
          });
        }
      }
    );

export const resultadoSchema =
  z.object({
    sets: z
      .array(setSchema)
      .min(1, {
        message:
          "Añade al menos un set",
      })
      .max(5, {
        message:
          "Un partido no puede tener más de 5 sets.",
      }),
  });

export type ResultadoFormValues =
  z.infer<
    typeof resultadoSchema
  >;