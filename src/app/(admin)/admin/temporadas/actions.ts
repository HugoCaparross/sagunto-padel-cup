"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/slug";

const SEASON_STATUSES = ["draft", "active", "closed", "archived"] as const;
type SeasonStatus = (typeof SEASON_STATUSES)[number];

function fail(message: string): never {
    redirect(`/admin/temporadas?error=${encodeURIComponent(message)}`);
}

export async function createSeason(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/temporadas");

    const name = String(formData.get("name") ?? "").trim();
    const startDate = String(formData.get("start_date") ?? "");
    const endDate = String(formData.get("end_date") ?? "");
    const status = String(formData.get("status") ?? "draft") as SeasonStatus;

    if (!name || !startDate || !endDate) fail("Completa nombre y fechas.");
    if (endDate < startDate) fail("La fecha de fin no puede ser anterior al inicio.");
    if (!SEASON_STATUSES.includes(status)) fail("Estado no válido.");

    if (status === "active") {
        const { count } = await supabase
            .from("seasons")
            .select("id", { count: "exact", head: true })
            .eq("status", "active");
        if ((count ?? 0) > 0) fail("Ya hay una temporada activa. Ciérrala antes de activar otra.");
    }

    const { data, error } = await supabase
        .from("seasons")
        .insert({ name, slug: slugify(name), start_date: startDate, end_date: endDate, status, created_by: user.id })
        .select("id")
        .single();

    if (error || !data) fail("No se pudo crear la temporada. Revisa que el nombre no esté repetido.");

    await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "season.created",
        entity_table: "seasons",
        entity_id: data.id,
        new_values: { name, status, start_date: startDate, end_date: endDate },
    });

    revalidatePath("/admin/temporadas");
    revalidatePath("/admin");
    redirect("/admin/temporadas");
}

export async function changeSeasonStatus(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/temporadas");

    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "") as SeasonStatus;

    if (!id || !SEASON_STATUSES.includes(status)) fail("Datos no válidos.");

    const { data: current } = await supabase.from("seasons").select("status").eq("id", id).single();
    if (!current || current.status === status) return;

    if (status === "active") {
        const { count } = await supabase
            .from("seasons")
            .select("id", { count: "exact", head: true })
            .eq("status", "active")
            .neq("id", id);
        if ((count ?? 0) > 0) fail("Ya hay otra temporada activa. Ciérrala antes de activar esta.");
    }

    const { error } = await supabase.from("seasons").update({ status }).eq("id", id);
    if (error) fail("No se pudo cambiar el estado.");

    await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "season.status_changed",
        entity_table: "seasons",
        entity_id: id,
        old_values: { status: current.status },
        new_values: { status },
    });

    revalidatePath("/admin/temporadas");
    revalidatePath("/admin");
}