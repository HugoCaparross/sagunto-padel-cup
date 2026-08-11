// Ruta: src/lib/validations/registration.ts

import { z } from "zod";

export const registrationSchema =
  z
    .object({
      categoria_id: z
        .string()
        .uuid({
          message:
            "Selecciona una categoría",
        }),

      talla_camiseta: z.enum(
        [
          "XS",
          "S",
          "M",
          "L",
          "XL",
          "XXL",
        ],
        {
          message:
            "Selecciona tu talla de camiseta",
        }
      ),

      compañero_email: z
        .string()
        .trim()
        .email({
          message:
            "Introduce un email válido",
        })
        .optional()
        .or(
          z.literal("")
        ),

      quiere_bolsa_pareja:
        z.boolean(),
    })
    .superRefine(
      (values, ctx) => {
        const email =
          values.compañero_email
            ?.trim() ?? "";

        if (
          email === "" &&
          !values.quiere_bolsa_pareja
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "quiere_bolsa_pareja",
            ],
            message:
              "Indica el email de tu compañero/a o selecciona la bolsa de parejas.",
          });
        }
      }
    );

export type RegistrationFormValues =
  z.infer<
    typeof registrationSchema
  >;