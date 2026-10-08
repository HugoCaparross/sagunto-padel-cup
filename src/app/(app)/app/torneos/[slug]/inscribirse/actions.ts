"use server";

import { redirect } from "next/navigation";

import { getAuthenticatedContext } from "@/lib/auth/flow";
import {
    createIndividualRegistration,
} from "@/lib/services/registrations";

function readText(
    formData: FormData,
    name: string,
): string {
    const value =
        formData.get(name);

    return typeof value === "string"
        ? value.trim()
        : "";
}

export async function registerForTournament(
    formData: FormData,
) {
    const {
        user,
        player,
    } =
        await getAuthenticatedContext();

    if (!user) {
        redirect("/login");
    }

    if (
        !player ||
        !player.onboarding_completado
    ) {
        redirect("/registro/confirma");
    }

    if (player.role === "admin") {
        redirect("/admin/torneos");
    }

    const slug =
        readText(
            formData,
            "slug",
        );

    const tournamentId =
        readText(
            formData,
            "tournamentId",
        );

    const categoryId =
        readText(
            formData,
            "categoryId",
        );

    const partnerId =
        readText(
            formData,
            "partnerId",
        );

    const partnerMode =
        readText(
            formData,
            "partnerMode",
        );

    if (
        !slug ||
        !tournamentId ||
        !categoryId
    ) {
        redirect("/app");
    }

    try {
        await createIndividualRegistration(
            {
                tournamentId,
                categoryId,
                playerId:
                    player.id,
                shirtSize:
                    null,
                partnerSearch:
                    partnerMode ===
                    "pool",
                partnerId:
                    partnerMode ===
                        "partner" &&
                        partnerId
                        ? partnerId
                        : null,
            },
        );
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "No se ha podido completar la inscripción.";

        redirect(
            `/app/torneos/${encodeURIComponent(
                slug,
            )}/inscribirse?error=${encodeURIComponent(
                message,
            )}`,
        );
    }

    redirect(
        `/app/torneos/${encodeURIComponent(
            slug,
        )}/inscribirse?inscrito=1`,
    );
}