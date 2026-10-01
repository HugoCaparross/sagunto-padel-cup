"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAuthenticatedContext } from "@/lib/auth/flow";
import { updatePlayer } from "@/lib/services/players";

type ProfileActionState = {
    success: boolean;
    message: string;
    fieldErrors?: Partial<
        Record<
            | "nombre"
            | "apellidos"
            | "telefono"
            | "ciudad"
            | "instagram"
            | "pala"
            | "manoDominante",
            string
        >
    >;
};

const profileSchema = z.object({
    nombre: z.string().trim().min(1, "Introduce tu nombre.").max(80),
    apellidos: z.string().trim().min(1, "Introduce tus apellidos.").max(120),
    telefono: z.string().trim().max(30, "El teléfono es demasiado largo."),
    ciudad: z.string().trim().max(100, "La ciudad es demasiado larga."),
    instagram: z
        .string()
        .trim()
        .transform((value) => value.replace(/^@/, ""))
        .refine(
            (value) => value === "" || /^[a-zA-Z0-9._]{1,30}$/.test(value),
            "Introduce un usuario de Instagram válido.",
        ),
    pala: z.string().trim().max(100, "El dato de la pala es demasiado largo."),
    manoDominante: z.enum(["", "diestro", "zurdo"]),
});

export async function updateOwnProfile(
    _previousState: ProfileActionState,
    formData: FormData,
): Promise<ProfileActionState> {
    const { user, player } = await getAuthenticatedContext();

    if (!user || !player) {
        return {
            success: false,
            message: "Tu sesión no es válida. Inicia sesión de nuevo.",
        };
    }

    if (player.role !== "player") {
        return {
            success: false,
            message: "No tienes permiso para modificar este perfil.",
        };
    }

    const parsed = profileSchema.safeParse({
        nombre: formData.get("nombre"),
        apellidos: formData.get("apellidos"),
        telefono: formData.get("telefono"),
        ciudad: formData.get("ciudad"),
        instagram: formData.get("instagram"),
        pala: formData.get("pala"),
        manoDominante: formData.get("manoDominante"),
    });

    if (!parsed.success) {
        const fieldErrors: ProfileActionState["fieldErrors"] = {};

        for (const issue of parsed.error.issues) {
            const field = issue.path[0];

            if (
                typeof field === "string" &&
                field in {
                    nombre: true,
                    apellidos: true,
                    telefono: true,
                    ciudad: true,
                    instagram: true,
                    pala: true,
                    manoDominante: true,
                }
            ) {
                fieldErrors[field as keyof NonNullable<
                    ProfileActionState["fieldErrors"]
                >] = issue.message;
            }
        }

        return {
            success: false,
            message: "Revisa los campos indicados.",
            fieldErrors,
        };
    }

    try {
        await updatePlayer(player.id, {
            name: parsed.data.nombre,
            surname: parsed.data.apellidos,
            telefono: parsed.data.telefono || null,
            city: parsed.data.ciudad || null,
            instagram: parsed.data.instagram || null,
            pala: parsed.data.pala || null,
            dominantHand: parsed.data.manoDominante || null,
        });

        revalidatePath("/app/perfil");

        return {
            success: true,
            message: "Tus datos se han actualizado correctamente.",
        };
    } catch {
        return {
            success: false,
            message: "No se han podido guardar los cambios. Inténtalo de nuevo.",
        };
    }
}