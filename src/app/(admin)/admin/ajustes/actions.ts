"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

function back(kind: "error" | "ok", msg: string): never {
    redirect(`/admin/ajustes?${kind}=${encodeURIComponent(msg)}`);
}

export async function createPointsAdjustment(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/ajustes");

    const playerId = String(formData.get("player_id") ?? "");
    const seasonId = String(formData.get("season_id") ?? "");
    const points = Number(formData.get("points"));
    const reason = String(formData.get("reason") ?? "").trim();

    if (!playerId || !seasonId) back("error", "Selecciona jugador y temporada.");
    if (!Number.isFinite(points) || points === 0) back("error", "Indica una cantidad de puntos distinta de cero.");

    const { error } = await supabase.rpc("add_points_adjustment", {
        p_player_id: playerId,
        p_season_id: seasonId,
        p_points: points,
        p_reason: reason,
    });

    if (error) back("error", error.message);

    revalidatePath("/admin/ajustes");
    revalidatePath("/admin/jugadores");
    back("ok", "Ajuste registrado y auditado.");
}