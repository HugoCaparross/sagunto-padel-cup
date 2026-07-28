// Ruta: src/lib/validations/registration.ts
import { z } from "zod";

export const registrationSchema = z.object({
  categoria_id: z.string().uuid({ message: "Selecciona una categoría" }),
  talla_camiseta: z.enum(["XS", "S", "M", "L", "XL", "XXL"], {
    message: "Selecciona tu talla de camiseta",
  }),
  compañero_email: z
    .string()
    .email({ message: "Introduce un email válido" })
    .optional()
    .or(z.literal("")),
  quiere_bolsa_pareja: z.boolean(),
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;