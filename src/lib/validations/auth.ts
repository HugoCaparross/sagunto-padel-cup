// Ruta: src/lib/validations/auth.ts

import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, {
    message: "La contraseña debe tener al menos 8 caracteres",
  })
  .max(128, {
    message: "La contraseña no puede superar 128 caracteres",
  })
  .regex(/[a-z]/, {
    message: "La contraseña debe incluir una letra minúscula",
  })
  .regex(/[A-Z]/, {
    message: "La contraseña debe incluir una letra mayúscula",
  })
  .regex(/[0-9]/, {
    message: "La contraseña debe incluir un número",
  })
  .regex(/[^A-Za-z0-9]/, {
    message: "La contraseña debe incluir un símbolo",
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({
      message: "Introduce un email válido",
    })
    .max(254, {
      message: "El email es demasiado largo",
    }),

  password: z
    .string()
    .min(1, {
      message: "Introduce tu contraseña",
    })
    .max(128, {
      message: "La contraseña no puede superar 128 caracteres",
    }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, {
      message: "Introduce tu nombre",
    })
    .max(80, {
      message: "El nombre es demasiado largo",
    }),

  apellidos: z
    .string()
    .trim()
    .min(2, {
      message: "Introduce tus apellidos",
    })
    .max(120, {
      message: "Los apellidos son demasiado largos",
    }),

  email: z
    .string()
    .trim()
    .email({
      message: "Introduce un email válido",
    })
    .max(254, {
      message: "El email es demasiado largo",
    }),

  telefono: z
    .string()
    .trim()
    .min(9, {
      message: "Introduce un teléfono válido",
    })
    .max(25, {
      message: "El teléfono es demasiado largo",
    }),

  password: passwordSchema,
});

export type SignupFormValues = z.infer<typeof signupSchema>;
