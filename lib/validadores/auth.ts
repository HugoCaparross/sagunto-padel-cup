import { z } from "zod";

export const TALLAS = ["XS", "S", "M", "L", "XL", "XXL"] as const;

const email = z.email({ error: "Email no válido" }).max(254);
const password = z
    .string()
    .min(10, "La contraseña debe tener al menos 10 caracteres")
    .max(72, "La contraseña es demasiado larga");

export const esquemaLogin = z.object({
    email,
    password: z.string().min(1, "Escribe tu contraseña"),
    siguiente: z.string().optional(),
});

export const esquemaRegistro = z.object({
    nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
    email,
    password,
    aceptaCondiciones: z.literal(true, {
        error: "Debes aceptar la política de privacidad y el reglamento",
    }),
});

export const esquemaRecuperar = z.object({ email });

export const esquemaNuevaContrasena = z
    .object({
        password,
        confirmacion: z.string(),
    })
    .refine((d) => d.password === d.confirmacion, {
        message: "Las contraseñas no coinciden",
        path: ["confirmacion"],
    });

export const esquemaOnboarding = z.object({
    nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
    tallaCamiseta: z.enum(TALLAS).nullable(),
    consentimientoPrivacidad: z.literal(true, {
        error: "Debes aceptar la política de privacidad",
    }),
    mayoriaOTutor: z.literal(true, {
        error: "Confirma que eres mayor de edad o que tienes autorización de tu tutor",
    }),
    consentimientoImagen: z.boolean(),
    visibilidadPublica: z.boolean(),
});