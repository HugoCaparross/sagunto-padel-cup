"use server";

import { redirect } from "next/navigation";

import {
    completeRegistrationSchema,
} from "@/lib/validators/auth";

import {
    createPlayer,
    getPlayerByAuthUserId,
    updatePlayer,
} from "@/lib/services/players";

import {
    createClient,
} from "@/lib/supabase/server";

export type RegistrationState = {
    success: boolean;
    message: string;
    fieldErrors: Record<
        string,
        string[]
    >;
};

export const initialRegistrationState: RegistrationState =
{
    success: false,
    message: "",
    fieldErrors: {},
};

export async function completeRegistration(
    _previousState: RegistrationState,
    formData: FormData,
): Promise<RegistrationState> {
    const supabase =
        await createClient();

    const {
        data: {
            user,
        },
        error: userError,
    } =
        await supabase.auth.getUser();

    if (userError || !user) {
        return {
            ...initialRegistrationState,
            message:
                "Tu sesión ha caducado. Vuelve a iniciar sesión.",
        };
    }

    const raw = {
        nombre:
            String(
                formData.get(
                    "nombre",
                ) ?? "",
            ),

        apellidos:
            String(
                formData.get(
                    "apellidos",
                ) ?? "",
            ),

        telefono:
            String(
                formData.get(
                    "telefono",
                ) ?? "",
            ),

        ciudad:
            String(
                formData.get(
                    "ciudad",
                ) ?? "",
            ),

        instagram:
            String(
                formData.get(
                    "instagram",
                ) ?? "",
            ),

        pala:
            String(
                formData.get(
                    "pala",
                ) ?? "",
            ),

        mano_dominante:
            String(
                formData.get(
                    "mano_dominante",
                ) ?? "",
            ),

        categoria_actual_id:
            String(
                formData.get(
                    "categoria_actual_id",
                ) ?? "",
            ),

        acceptTerms:
            formData.get(
                "acceptTerms",
            ) === "on",

        acceptPrivacy:
            formData.get(
                "acceptPrivacy",
            ) === "on",
    };

    const parsed =
        completeRegistrationSchema.safeParse(
            raw,
        );

    if (!parsed.success) {
        const fieldErrors:
            Record<
                string,
                string[]
            > = {};

        for (const issue of
            parsed.error.issues) {
            const key =
                String(
                    issue.path[0] ??
                    "form",
                );

            fieldErrors[key] ??= [];

            fieldErrors[key].push(
                issue.message,
            );
        }

        return {
            ...initialRegistrationState,

            message:
                "Revisa los campos marcados.",

            fieldErrors,
        };
    }

    try {
        const existingPlayer =
            await getPlayerByAuthUserId(
                user.id,
            );

        const metadata =
            user.user_metadata ?? {};

        const avatarUrl =
            typeof metadata.avatar_url ===
                "string"
                ? metadata.avatar_url
                : null;

        const input = {
            authUserId:
                user.id,

            name:
                parsed.data.nombre,

            surname:
                parsed.data.apellidos,

            email:
                user.email ?? "",

            telefono:
                parsed.data.telefono ||
                null,

            foto_url:
                avatarUrl,

            currentCategoryId:
                parsed.data
                    .categoria_actual_id ||
                null,

            dominantHand:
                parsed.data
                    .mano_dominante ===
                    "diestro" ||
                    parsed.data
                        .mano_dominante ===
                    "zurdo"
                    ? parsed.data
                        .mano_dominante
                    : null,

            pala:
                parsed.data.pala ||
                null,

            city:
                parsed.data.ciudad ||
                null,

            instagram:
                parsed.data.instagram ||
                null,

            onboardingCompleted:
                true,
        } as const;

        if (existingPlayer) {
            await updatePlayer(
                existingPlayer.id,
                input,
            );
        } else {
            await createPlayer(
                input,
            );
        }
    } catch (error) {
        console.error(
            "[SPC Registration Completion]",
            error,
        );

        return {
            ...initialRegistrationState,

            message:
                "No hemos podido guardar tu perfil. Inténtalo de nuevo.",
        };
    }

    redirect(
        "/app/perfil?welcome=1",
    );
}