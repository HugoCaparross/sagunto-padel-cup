// Ruta: src/lib/validations/auth.ts

import { z } from "zod";

export const loginSchema =
  z.object({
    email: z
      .string()
      .trim()
      .email({
        message:
          "Introduce un email válido",
      }),

    password: z
      .string()
      .min(6, {
        message:
          "Mínimo 6 caracteres",
      }),
  });

export type LoginFormValues =
  z.infer<
    typeof loginSchema
  >;

export const signupSchema =
  z.object({
    nombre: z
      .string()
      .trim()
      .min(2, {
        message:
          "Introduce tu nombre",
      }),

    apellidos: z
      .string()
      .trim()
      .min(2, {
        message:
          "Introduce tus apellidos",
      }),

    email: z
      .string()
      .trim()
      .email({
        message:
          "Introduce un email válido",
      }),

    telefono: z
      .string()
      .trim()
      .min(9, {
        message:
          "Introduce un teléfono válido",
      }),

    password: z
      .string()
      .min(6, {
        message:
          "Mínimo 6 caracteres",
      }),
  });

export type SignupFormValues =
  z.infer<
    typeof signupSchema
  >;