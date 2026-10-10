"use server";

import { redirect } from "next/navigation";

import {
    completeRegistrationSchema,
} from "@/lib/validators/auth";

import {
    createClient,
} from "@/lib/supabase/server";

import {
    initialRegistrationState,
} from "./registration-state";

import type {
    RegistrationState,
} from "./registration-state";

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
        const metadata =
            user.user_metadata ?? {};

        const avatarUrl =
            typeof metadata.avatar_url === "string"
                ? metadata.avatar_url
                : null;

        const {
            error: onboardingError,
        } = await supabase.rpc("complete_player_onboarding", {
            p_nombre: parsed.data.nombre,
            p_apellidos: parsed.data.apellidos,
            p_telefono: parsed.data.telefono || null,
            p_ciudad: parsed.data.ciudad || null,
            p_instagram: parsed.data.instagram || null,
            p_pala: parsed.data.pala || null,
            p_mano_dominante: parsed.data.mano_dominante || null,
            p_categoria_actual_id: parsed.data.categoria_actual_id || null,
            p_foto_url: avatarUrl,
            p_accept_terms: parsed.data.acceptTerms,
            p_accept_privacy: parsed.data.acceptPrivacy,
        });

        if (onboardingError) {
            throw onboardingError;
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