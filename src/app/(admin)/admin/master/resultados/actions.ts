"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { PLACEMENTS } from "@/lib/placements";

// El Máster no tiene participación inicial
const MASTER_CODES: number[] = PLACEMENTS.filter((p) => p.code !== 33).map((p) => p.code);

function back(eventId: string, kind: "error" | "ok", msg: string): never {
    redirect(`/admin/master/resultados?event=${eventId}&${kind}=${encodeURIComponent(msg)}`);
}

export async function createMasterPair(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/master/resultados");

    const eventId = String(formData.get("event_id") ?? "");
    const categoryId = String(formData.get("category_id") ?? "");
    const p1 = String(formData.get("player_1") ?? "");
    const p2 = String(formData.get("player_2") ?? "");

    if (!categoryId || !p1 || !p2 || p1 === p2) {
        back(eventId, "error", "Selecciona una categoría y dos jugadores distintos.");
    }

    const { data: hist } = await supabase
        .from("player_category_history")
        .select("player_id")
        .in("player_id", [p1, p2])
        .eq("category_id", categoryId)
        .is("valid_to", null);

    if ((hist ?? []).length < 2) {
        back(eventId, "error", "Los dos jugadores deben estar en la categoría elegida.");
    }

    let ec: any = (
        await supabase
            .from("event_categories")
            .select("id")
            .eq("event_id", eventId)
            .eq("category_id", categoryId)
            .is("subgroup_id", null)
            .maybeSingle()
    ).data;

    if (!ec) {
        const { data: created, error: ecError } = await supabase
            .from("event_categories")
            .insert({ event_id: eventId, category_id: categoryId })
            .select("id")
            .single();
        if (ecError || !created) back(eventId, "error", "No se pudo preparar la categoría del Máster.");
        ec = created;
    }

    const { data: reg, error: regError } = await supabase
        .from("registrations")
        .insert({
            event_id: eventId,
            event_category_id: ec.id,
            status: "confirmed",
            submitted_by: user.id,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

    if (regError || !reg) back(eventId, "error", "No se pudo crear la pareja.");

    const { error: rpError } = await supabase.from("registration_players").insert([
        { registration_id: reg.id, player_id: p1, player_order: 1 },
        { registration_id: reg.id, player_id: p2, player_order: 2 },
    ]);

    if (rpError) {
        // La base de datos rechaza jugadores no confirmados: deshacemos la pareja vacía
        await supabase.from("registrations").delete().eq("id", reg.id);
        back(eventId, "error", rpError.message);
    }

    revalidatePath("/admin/master/resultados");
    back(eventId, "ok", "Pareja creada.");
}

export async function saveMasterResults(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/master/resultados");

    const eventId = String(formData.get("event_id") ?? "");

    const { data: ev } = await supabase.from("events").select("status").eq("id", eventId).single();
    if (ev?.status === "completed") {
        back(eventId, "error", "El Máster está finalizado; no se pueden cambiar los resultados.");
    }

    const ids = formData.getAll("registration_ids").map(String);

    for (const id of ids) {
        const pl = String(formData.get(`pl_${id}`) ?? "");

        if (!pl) {
            await supabase.from("master_final_results").delete().eq("registration_id", id);
            continue;
        }

        const placement = Number(pl);
        if (!MASTER_CODES.includes(placement)) back(eventId, "error", "Posición no válida.");

        const { error } = await supabase.from("master_final_results").upsert(
            {
                registration_id: id,
                event_id: eventId,
                placement,
                set_by: user.id,
                set_at: new Date().toISOString(),
            },
            { onConflict: "registration_id" },
        );

        if (error) back(eventId, "error", "No se pudo guardar un resultado.");
    }

    revalidatePath("/admin/master/resultados");
    back(eventId, "ok", "Resultados del Máster guardados.");
}

export async function completeMaster(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/master/resultados");

    const eventId = String(formData.get("event_id") ?? "");

    const { count } = await supabase
        .from("master_final_results")
        .select("registration_id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("placement", 1);

    if ((count ?? 0) === 0) {
        back(eventId, "error", "Asigna al menos un campeón antes de finalizar el Máster.");
    }

    const { error } = await supabase.from("events").update({ status: "completed" }).eq("id", eventId);
    if (error) back(eventId, "error", "No se pudo finalizar el Máster.");

    await supabase.rpc("log_audit", {
        p_action: "master.completed",
        p_entity_table: "events",
        p_entity_id: eventId,
        p_old: null,
        p_new: { status: "completed" },
        p_reason: null,
    });

    revalidatePath("/admin/master/resultados");
    revalidatePath("/admin/master");
    back(eventId, "ok", "Máster Final finalizado. Los resultados ya son públicos.");
}