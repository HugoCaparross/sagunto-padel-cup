"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

export async function executeSeasonClosure(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/cierre");

    const seasonId = String(formData.get("season_id") ?? "");
    const nextId = String(formData.get("next_season_id") ?? "") || null;
    const confirmed = formData.get("confirm") === "on";
    const base = `/admin/cierre?season=${seasonId}`;

    if (!confirmed) {
        redirect(`${base}&error=${encodeURIComponent("Marca la casilla de confirmación para ejecutar el cierre.")}`);
    }

    const { error } = await supabase.rpc("close_season", {
        p_season_id: seasonId,
        p_next_season_id: nextId,
    });

    if (error) redirect(`${base}&error=${encodeURIComponent(error.message)}`);

    revalidatePath("/admin/cierre");
    revalidatePath("/admin");
    revalidatePath("/admin/jugadores");
    redirect(`${base}&ok=${encodeURIComponent("Cierre 70/30 ejecutado. Snapshot y auditoría registrados.")}`);
}