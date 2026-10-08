"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedContext } from "@/lib/auth/flow";
import { getRegistrationById } from "@/lib/services/registrations";
import { createClient } from "@/lib/supabase/server";

function readText(
    formData: FormData,
    name: string,
): string {
    const value = formData.get(name);

    return typeof value === "string"
        ? value.trim()
        : "";
}

export async function cancelMyRegistrationAction(
    formData: FormData,
): Promise<void> {
    const registrationId = readText(
        formData,
        "registrationId",
    );

    if (!registrationId) {
        redirect(
            "/app/inscripciones?resultado=error",
        );
    }

    const {
        user,
        player,
    } = await getAuthenticatedContext();

    if (!user || !player) {
        redirect(
            `/login?redirectTo=${encodeURIComponent(
                "/app/inscripciones",
            )}`,
        );
    }

    try {
        const registration =
            await getRegistrationById(
                registrationId,
            );

        if (!registration) {
            throw new Error(
                "La inscripción no existe.",
            );
        }

        const pair = registration.pair;

        if (!pair) {
            throw new Error(
                "La inscripción no tiene una pareja asociada.",
            );
        }

        const belongsToPlayer =
            pair.player_1_id === player.id ||
            pair.player_2_id === player.id;

        if (!belongsToPlayer) {
            throw new Error(
                "No puedes modificar esta inscripción.",
            );
        }

        if (
            registration.estado ===
            "cancelada"
        ) {
            throw new Error(
                "La inscripción ya está cancelada.",
            );
        }

        if (
            registration.estado !==
            "confirmada" &&
            registration.estado !==
            "pendiente_pago" &&
            registration.estado !==
            "lista_espera"
        ) {
            throw new Error(
                "Esta inscripción no se puede cancelar.",
            );
        }

        const supabase =
            await createClient();

        const {
            error,
        } = await supabase
            .from("registrations")
            .update({
                estado: "cancelada",
            })
            .eq(
                "id",
                registrationId,
            );

        if (error) {
            throw new Error(
                `No se pudo cancelar la inscripción: ${error.message}`,
            );
        }

        /*
         * Si el jugador estaba buscando pareja,
         * dejamos de mostrarlo en el Partner Pool.
         *
         * No creamos ningún registro nuevo:
         * utilizamos el partner_pool existente.
         */
        await supabase
            .from("partner_pool")
            .update({
                disponible: false,
            })
            .eq(
                "player_id",
                player.id,
            )
            .eq(
                "tournament_id",
                registration.tournament_id,
            )
            .eq(
                "categoria_id",
                registration.categoria_id ??
                pair.categoria_id,
            );
    } catch (error) {
        console.error(
            "[App] No se pudo cancelar la inscripción",
            error,
        );

        redirect(
            "/app/inscripciones?resultado=error",
        );
    }

    revalidatePath(
        "/app/inscripciones",
    );

    revalidatePath(
        "/app",
    );

    redirect(
        "/app/inscripciones?resultado=cancelada",
    );
}