"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminContext } from "@/lib/services/admin";
import { createTournament } from "@/lib/services/tournaments";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
    if (!DATE_PATTERN.test(value)) return false;

    const date = new Date(`${value}T12:00:00`);
    return (
        Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

function readText(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

export async function createTournamentAction(
    _previousState: { error?: string },
    formData: FormData,
): Promise<{ error?: string }> {
    await requireAdminContext();

    const name = readText(formData, "name");
    const slug = readText(formData, "slug");
    const seasonId = readText(formData, "seasonId");
    const clubId = readText(formData, "clubId");
    const startDate = readText(formData, "startDate");
    const endDate = readText(formData, "endDate");
    const tournamentType = readText(formData, "tournamentType") || "regular";
    const price = readText(formData, "price");
    const description = readText(formData, "description");

    if (!name || !slug || !seasonId || !clubId) {
        return { error: "Completa todos los campos obligatorios." };
    }

    if (name.length > 120 || slug.length > 120) {
        return { error: "El nombre o el identificador del torneo es demasiado largo." };
    }

    if (
        tournamentType !== "regular" &&
        tournamentType !== "master"
    ) {
        return { error: "El tipo de torneo no es válido." };
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        return { error: "Introduce fechas válidas para el torneo." };
    }

    if (endDate < startDate) {
        return { error: "La fecha de finalización no puede ser anterior a la de inicio." };
    }

    if (price.length > 80) {
        return { error: "El texto del precio es demasiado largo." };
    }

    if (description.length > 5000) {
        return { error: "La descripción supera el máximo permitido." };
    }

    let tournament;

    try {
        tournament = await createTournament({
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
    } catch {
        return {
            error: "No se pudo crear el torneo. Revisa los datos e inténtalo de nuevo.",
        };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/torneos");

    redirect(`/admin/torneos/${tournament.id}`);
}
