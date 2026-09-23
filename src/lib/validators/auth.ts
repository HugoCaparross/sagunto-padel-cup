import { z } from "zod";

const email = z
    .string()
    .trim()
    .toLowerCase()
    .email("Introduce un email válido.")
    .max(254, "El email es demasiado largo.");

const password = z
    .string()
    .min(
        8,
        "La contraseña debe tener al menos 8 caracteres.",
    )
    .max(
        72,
        "La contraseña es demasiado larga.",
    )
    .refine(
        (value) => /[A-Za-z]/.test(value),
        {
            message:
                "La contraseña debe incluir al menos una letra.",
        },
    )
    .refine(
        (value) => /\d/.test(value),
        {
            message:
                "La contraseña debe incluir al menos un número.",
        },
    );

export const loginSchema = z.object({
    email,

    password: z
        .string()
        .min(
            1,
            "Introduce tu contraseña.",
        ),
});

export const registerSchema = z
    .object({
        email,

        password,

        confirmPassword:
            z
                .string()
                .min(
                    1,
                    "Confirma tu contraseña.",
                ),

        acceptTerms:
            z.literal(
                true,
                {
                    error:
                        "Debes aceptar las condiciones de uso.",
                },
            ),

        acceptPrivacy:
            z.literal(
                true,
                {
                    error:
                        "Debes aceptar la política de privacidad.",
                },
            ),
    })
    .refine(
        (data) =>
            data.password ===
            data.confirmPassword,
        {
            path: [
                "confirmPassword",
            ],

            message:
                "Las contraseñas no coinciden.",
        },
    );

export const forgotPasswordSchema =
    z.object({
        email,
    });

export const resetPasswordSchema =
    z
        .object({
            password,

            confirmPassword:
                z
                    .string()
                    .min(
                        1,
                        "Confirma tu contraseña.",
                    ),
        })
        .refine(
            (data) =>
                data.password ===
                data.confirmPassword,
            {
                path: [
                    "confirmPassword",
                ],

                message:
                    "Las contraseñas no coinciden.",
            },
        );

export const completeRegistrationSchema =
    z.object({
        nombre:
            z
                .string()
                .trim()
                .min(
                    2,
                    "El nombre debe tener al menos 2 caracteres.",
                )
                .max(
                    80,
                    "El nombre es demasiado largo.",
                ),

        apellidos:
            z
                .string()
                .trim()
                .min(
                    2,
                    "Los apellidos deben tener al menos 2 caracteres.",
                )
                .max(
                    120,
                    "Los apellidos son demasiado largos.",
                ),

        telefono:
            z
                .string()
                .trim()
                .max(
                    30,
                    "El teléfono es demasiado largo.",
                )
                .optional()
                .or(z.literal("")),

        ciudad:
            z
                .string()
                .trim()
                .max(
                    100,
                    "La ciudad es demasiado larga.",
                )
                .optional()
                .or(z.literal("")),

        instagram:
            z
                .string()
                .trim()
                .max(
                    100,
                    "El usuario de Instagram es demasiado largo.",
                )
                .optional()
                .or(z.literal("")),

        pala:
            z
                .string()
                .trim()
                .max(
                    120,
                    "El nombre de la pala es demasiado largo.",
                )
                .optional()
                .or(z.literal("")),

        mano_dominante:
            z
                .enum([
                    "diestro",
                    "zurdo",
                ])
                .optional()
                .or(z.literal("")),

        categoria_actual_id:
            z
                .string()
                .uuid(
                    "La categoría seleccionada no es válida.",
                )
                .optional()
                .or(z.literal("")),

        acceptTerms:
            z.literal(
                true,
                {
                    error:
                        "Debes aceptar las condiciones de uso.",
                },
            ),

        acceptPrivacy:
            z.literal(
                true,
                {
                    error:
                        "Debes aceptar la política de privacidad.",
                },
            ),
    });

export type LoginInput =
    z.infer<typeof loginSchema>;

export type RegisterInput =
    z.infer<typeof registerSchema>;

export type ForgotPasswordInput =
    z.infer<
        typeof forgotPasswordSchema
    >;

export type ResetPasswordInput =
    z.infer<
        typeof resetPasswordSchema
    >;

export type CompleteRegistrationInput =
    z.infer<
        typeof completeRegistrationSchema
    >;