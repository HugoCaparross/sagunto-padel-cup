"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { madridToIso } from "@/lib/time";

// Los cuadros usan orden 11, 12, 13... para no chocar con el orden 1 de los partidos sueltos
const STAGE_ORDER_OFFSET = 10;

function go(eventId: string, kind: "error" | "ok", msg: string): never {
    redirect(`/admin/cuadros?event=${eventId}&${kind}=${encodeURIComponent(msg)}`);
}

export async function createBracketStage(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/cuadros");

    const eventId = String(formData.get("event_id") ?? "");
    const categoryId = String(formData.get("category_id") ?? "");
    const subgroupId = String(formData.get("subgroup_id") ?? "");

    if (!eventId || !categoryId || !subgroupId) {
        go(eventId, "error", "Selecciona categoría y subgrupo.");
    }

    const { data: cat } = await supabase.from("categories").select("name").eq("id", categoryId).single();
    const { data: sub } = await supabase
        .from("subgroups")
        .select("name,display_order")
        .eq("id", subgroupId)
        .single();

    if (!cat || !sub) {
        go(eventId, "error", "Categoría o subgrupo no válidos.");
    }

    let ecRow: any = (
        await supabase
            .from("event_categories")
            .select("id")
            .eq("event_id", eventId)
            .eq("category_id", categoryId)
            .is("subgroup_id", null)
            .maybeSingle()
    ).data;

    if (!ecRow) {
        const { data: created, error: ecError } = await supabase
            .from("event_categories")
            .insert({ event_id: eventId, category_id: categoryId })
            .select("id")
            .single();
        if (ecError || !created) go(eventId, "error", "No se pudo preparar la categoría de la prueba.");
        ecRow = created;
    }

    const { data: stage, error: stageError } = await supabase
        .from("competition_stages")
        .insert({
            event_category_id: ecRow.id,
            name: `Cuadro ${(sub as any).name}`,
            stage_type: "knockout",
            stage_order: STAGE_ORDER_OFFSET + (sub as any).display_order,
            status: "draft",
            rules_json: {},
        })
        .select("id")
        .single();

    if (stageError || !stage) {
        go(eventId, "error", "Ya existe un cuadro de esa categoría y subgrupo en esta prueba.");
    }

    const { error } = await supabase.from("bracket_stages").insert({
        stage_id: (stage as any).id,
        event_id: eventId,
        category_id: categoryId,
        subgroup_id: subgroupId,
    });

    if (error) {
        await supabase.from("competition_stages").delete().eq("id", (stage as any).id);
        go(eventId, "error", "Ya existe un cuadro de esa categoría y subgrupo en esta prueba.");
    }

    revalidatePath("/admin/cuadros");
    go(eventId, "ok", "Cuadro creado. Asigna las cabezas de serie y genera el cuadro.");
}

export async function saveBracketSeeds(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/cuadros");

    const eventId = String(formData.get("event_id") ?? "");
    const stageId = String(formData.get("stage_id") ?? "");

    const { data: stage } = await supabase
        .from("competition_stages")
        .select("status")
        .eq("id", stageId)
        .single();

    if (!stage || stage.status !== "draft") {
        go(eventId, "error", "Solo se pueden cambiar parejas de un cuadro en borrador.");
    }

    const picks: { reg: string; seed: number }[] = [];
    for (const [key, raw] of formData.entries()) {
        if (!key.startsWith("seed_")) continue;
        const value = String(raw);
        if (!value) continue;
        picks.push({ reg: key.slice(5), seed: Number(value) });
    }

    if (picks.some((p) => !Number.isInteger(p.seed) || p.seed < 1)) {
        go(eventId, "error", "Cabeza de serie no válida.");
    }
    if (new Set(picks.map((p) => p.seed)).size !== picks.length) {
        go(eventId, "error", "Dos parejas no pueden tener el mismo número de cabeza de serie.");
    }

    const regIds = picks.map((p) => p.reg);

    if (regIds.length > 0) {
        const { data: others } = await supabase
            .from("bracket_entries")
            .select("registration_id,stage_id,competition_stages(status)")
            .in("registration_id", regIds)
            .neq("stage_id", stageId);

        if ((others ?? []).some((o: any) => o.competition_stages?.status !== "draft")) {
            go(eventId, "error", "Alguna pareja ya está en un cuadro en juego.");
        }

        await supabase.from("bracket_entries").delete().in("registration_id", regIds);
    }

    await supabase.from("bracket_entries").delete().eq("stage_id", stageId);

    if (picks.length > 0) {
        const { error } = await supabase.from("bracket_entries").insert(
            picks.map((p) => ({ registration_id: p.reg, stage_id: stageId, seed: p.seed })),
        );
        if (error) go(eventId, "error", "No se pudieron guardar las parejas.");
    }

    revalidatePath("/admin/cuadros");
    go(eventId, "ok", `Cabezas de serie guardadas: ${picks.length} parejas.`);
}

export async function generateBracket(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/cuadros");

    const eventId = String(formData.get("event_id") ?? "");
    const stageId = String(formData.get("stage_id") ?? "");

    const { data, error } = await supabase.rpc("generate_bracket", { p_stage: stageId });
    if (error) go(eventId, "error", error.message);

    revalidatePath("/admin/cuadros");
    go(eventId, "ok", `Cuadro generado: ${data} partidos. Las parejas sin rival han pasado directamente.`);
}

export async function deleteDraftStage(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/cuadros");

    const eventId = String(formData.get("event_id") ?? "");
    const stageId = String(formData.get("stage_id") ?? "");

    const { error } = await supabase
        .from("competition_stages")
        .delete()
        .eq("id", stageId)
        .eq("status", "draft");

    if (error) go(eventId, "error", "No se pudo eliminar el cuadro.");

    revalidatePath("/admin/cuadros");
    go(eventId, "ok", "Cuadro eliminado.");
}

export async function scheduleMatch(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/cuadros");

    const eventId = String(formData.get("event_id") ?? "");
    const matchId = String(formData.get("match_id") ?? "");
    const court = String(formData.get("court_name") ?? "").trim() || null;
    const when = madridToIso(String(formData.get("scheduled_at") ?? ""));

    const { error } = await supabase
        .from("matches")
        .update({ scheduled_at: when, court_name: court })
        .eq("id", matchId);

    if (error) {
        go(
            eventId,
            "error",
            error.code === "23505"
                ? "Esa pista ya tiene un partido a esa hora."
                : "No se pudo programar el partido.",
        );
    }

    revalidatePath("/admin/cuadros");
    go(eventId, "ok", "Partido programado.");
}

export async function applyBracketResults(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/cuadros");

    const eventId = String(formData.get("event_id") ?? "");
    const stageId = String(formData.get("stage_id") ?? "");

    const { data, error } = await supabase.rpc("apply_bracket_results", { p_stage: stageId });
    if (error) go(eventId, "error", error.message);

    revalidatePath("/admin/cuadros");
    go(
        eventId,
        "ok",
        `Resultados aplicados a ${data} parejas. Revísalos en Resultados de la prueba y asigna los puntos.`,
    );
}