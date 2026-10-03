"use server";

import { revalidatePath } from "next/cache";
import { editTournament, requireAdminContext, writeAdminAuditLog } from "@/lib/services/admin";

type EditState = { error?: string; success?: string };

function text(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function updateTournamentAction(
    tournamentId: string,
    _previous: EditState,
    formData: FormData,
): Promise<EditState> {
    await requireAdminContext();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tournamentId)) return { error: "El identificador del torneo no es vÃ¡lido." };

    const name = text(formData, "name");
    const slug = text(formData, "slug");
    const seasonId = text(formData, "seasonId");
    const clubId = text(formData, "clubId");
    const startDate = text(formData, "startDate");
    const endDate = text(formData, "endDate");
    const tournamentType = text(formData, "tournamentType");
    const price = text(formData, "price");
    const description = text(formData, "description");

    if (!name || !slug || !seasonId || !clubId) return { error: "Nombre, slug, temporada y club son obligatorios." };
    if (name.length > 120 || slug.length > 120) return { error: "Nombre y slug admiten un mÃ¡ximo de 120 caracteres." };
    if (price.length > 80 || description.length > 5000) return { error: "El precio o la descripciÃ³n superan el mÃ¡ximo permitido." };
    if (tournamentType !== "regular" && tournamentType !== "master") return { error: "El tipo de torneo no es vÃ¡lido." };
    if (!validDate(startDate) || !validDate(endDate) || endDate < startDate) return { error: "Comprueba las fechas y asegÃºrate de que el fin no sea anterior al inicio." };

    try {
        await editTournament(tournamentId, {
            name, slug, seasonId, clubId, startDate, endDate,
            tournamentType, price: price || null, description: description || null,
        });
    } catch (error) {
        return { error: error instanceof Error ? error.message : "No se pudo guardar el torneo." };
    }

    try {
        await writeAdminAuditLog({ accion: "update", entityType: "tournament", entityId: tournamentId, metadata: { fields: ["name", "slug", "seasonId", "clubId", "startDate", "endDate", "tournamentType", "price", "description"] } });
    } catch (error) {
        revalidatePath(`/admin/torneos/${tournamentId}`);
        revalidatePath(`/admin/torneos/${tournamentId}/editar`);
        revalidatePath("/admin/torneos");
        revalidatePath("/");
        return { error: `Los cambios se guardaron, pero no se pudo registrar la auditor?a: ${error instanceof Error ? error.message : "error desconocido"}` };
    }

    revalidatePath(`/admin/torneos/${tournamentId}`);
    revalidatePath(`/admin/torneos/${tournamentId}/editar`);
    revalidatePath("/admin/torneos");
    revalidatePath("/");
    return { success: "Los datos del torneo se han guardado." };
}
