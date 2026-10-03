"use server";

import { revalidatePath } from "next/cache";
import { addTournamentCategory, getTournamentCategories, updateTournamentCategory } from "@/lib/services/tournaments";
import { requireAdminContext, writeAdminAuditLog } from "@/lib/services/admin";

type State = { error?: string; success?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function capacity(formData: FormData, key: string): number | null | undefined {
    const value = formData.get(key);
    if (typeof value !== "string") return undefined;
    if (value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function saveTournamentCategoryAction(tournamentId: string, _previous: State, formData: FormData): Promise<State> {
    await requireAdminContext();
    if (!UUID.test(tournamentId)) return { error: "El identificador del torneo no es válido." };
    const mode = formData.get("mode");
    const minimum = capacity(formData, "minCapacity");
    const maximum = capacity(formData, "maxCapacity");
    if (minimum === undefined || maximum === undefined) return { error: "Los cupos deben ser números enteros iguales o mayores que cero." };
    if (minimum !== null && maximum !== null && minimum > maximum) return { error: "El cupo mínimo no puede superar el máximo." };

    let changed = false;
    try {
        if (mode === "add") {
            const categoryId = formData.get("categoryId");
            if (typeof categoryId !== "string" || !UUID.test(categoryId)) return { error: "Selecciona una categoría válida." };
            const attached = await getTournamentCategories(tournamentId);
            if (attached.some((item) => item.categoria_id === categoryId)) return { error: "Esta categoría ya está añadida al torneo." };
            await addTournamentCategory({ tournamentId, categoryId, minCapacity: minimum, maxCapacity: maximum, registrationOpen: formData.get("enabled") === "on" });
            changed = true;
            await writeAdminAuditLog({ accion: "category_change", entityType: "tournament", entityId: tournamentId, metadata: { operation: "add", categoryId } });
        } else if (mode === "update") {
            const categoryId = formData.get("categoryId");
            if (typeof categoryId !== "string" || !UUID.test(categoryId)) return { error: "La categoría seleccionada no es válida." };
            const attached = await getTournamentCategories(tournamentId);
            if (!attached.some((item) => item.categoria_id === categoryId)) return { error: "La categoría ya no pertenece a este torneo. Recarga la página." };
            await updateTournamentCategory(tournamentId, categoryId, { minCapacity: minimum, maxCapacity: maximum, registrationOpen: formData.get("enabled") === "on" });
            changed = true;
            await writeAdminAuditLog({ accion: "category_change", entityType: "tournament", entityId: tournamentId, metadata: { operation: "update", categoryId, minimum, maximum, enabled: formData.get("enabled") === "on" } });
        } else {
            return { error: "La operación solicitada no es válida." };
        }
    } catch (error) {
        if (changed) {
            revalidatePath(`/admin/torneos/${tournamentId}`);
            revalidatePath(`/admin/torneos/${tournamentId}/categorias`);
            return { error: `La categoria se guardo, pero fallo el registro de auditoria: ${error instanceof Error ? error.message : "error desconocido"}` };
        }
        return { error: error instanceof Error ? error.message : "No se pudo guardar la categoría." };
    }

    revalidatePath(`/admin/torneos/${tournamentId}`);
    revalidatePath(`/admin/torneos/${tournamentId}/categorias`);
    return { success: "La configuración de categorías se ha guardado." };
}
