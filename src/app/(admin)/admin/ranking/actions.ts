"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

function back(seasonId: string, kind: "error" | "ok", msg: string): never {
    redirect(`/admin/ranking?season=${seasonId}&${kind}=${encodeURIComponent(msg)}`);
}

export async function createRankingSnapshot(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/ranking");

    const seasonId = String(formData.get("season_id") ?? "");
    const type = String(formData.get("type") ?? "live");
    const confirmed = formData.get("confirm") === "on";

    if (type !== "live" && type !== "published") back(seasonId, "error", "Tipo no válido.");
    if (type === "published" && !confirmed) {
        back(seasonId, "error", "Confirma la publicación para hacer público el ranking.");
    }

    const { error } = await supabase.rpc("create_ranking_snapshot", {
        p_season_id: seasonId,
        p_type: type,
    });

    if (error) back(seasonId, "error", error.message);

    revalidatePath("/admin/ranking");
    back(
        seasonId,
        "ok",
        type === "published" ? "Ranking publicado y snapshot guardado." : "Snapshot en vivo guardado.",
    );
}