"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

function go(playerId: string, kind: "error" | "ok", msg: string): never {
    const q = playerId ? `player=${playerId}&` : "";
    redirect(`/admin/categorias/asignaciones?${q}${kind}=${encodeURIComponent(msg)}`);
}

export async function assignCategory(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/categorias/asignaciones");

    const playerId = String(formData.get("player_id") ?? "");
    const categoryId = String(formData.get("category_id") ?? "");
    const subgroupId = String(formData.get("subgroup_id") ?? "") || null;
    const validFrom = String(formData.get("valid_from") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();

    if (!playerId || !categoryId || !validFrom) {
        go(playerId, "error", "Completa jugador, categoría y fecha de inicio.");
    }

    const { error } = await supabase.rpc("assign_player_category", {
        p_player: playerId,
        p_category: categoryId,
        p_subgroup: subgroupId,
        p_valid_from: validFrom,
        p_reason: reason,
    });

    if (error) go(playerId, "error", error.message);

    revalidatePath("/admin/categorias/asignaciones");
    revalidatePath("/admin/jugadores");
    revalidatePath(`/admin/jugadores/${playerId}`);
    go(playerId, "ok", "Categoría asignada desde la fecha indicada. El historial anterior se conserva.");
}