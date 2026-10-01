"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminContext } from "@/lib/services/admin";
import { createTournament } from "@/lib/services/tournaments";

export async function createTournamentAction(
    formData: FormData,
): Promise<void> {
    await requireAdminContext();

    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const seasonId = String(formData.get("seasonId") ?? "");
    const clubId = String(formData.get("clubId") ?? "");
    const startDate = String(formData.get("startDate") ?? "");
    const endDate = String(formData.get("endDate") ?? "");
    const tournamentType = String(
        formData.get("tournamentType") ?? "regular",
    );
    const price = String(formData.get("price") ?? "").trim();
    const description = String(
        formData.get("description") ?? "",
    ).trim();

    if (
        tournamentType !== "regular" &&
        tournamentType !== "master"
    ) {
        throw new Error("El tipo de torneo no es válido.");
    }

    if (!name || !slug || !seasonId || !clubId) {
        throw new Error(
            "Completa todos los campos obligatorios.",
        );
    }

    if (!startDate || !endDate || endDate < startDate) {
        throw new Error(
            "Comprueba las fechas del torneo.",
        );
    }

    const tournament = await createTournament({
        name,
        slug,
        seasonId,
        clubId,
        startDate,
        endDate,
        tournamentType,
        estado: "borrador",
        price: price || null,
        description: description || null,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/torneos");

    redirect(`/admin/torneos/${tournament.id}`);
}