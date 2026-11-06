"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

function back(setId: string, kind: "error" | "ok", msg: string): never {
    redirect(`/admin/reglas?set=${setId}&${kind}=${encodeURIComponent(msg)}`);
}

export async function cloneRuleSet(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/reglas");

    const sourceId = String(formData.get("source_id") ?? "");
    const version = String(formData.get("version") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;

    const { data, error } = await supabase.rpc("clone_rule_set", {
        p_source: sourceId,
        p_version: version,
        p_description: description,
    });

    if (error) back(sourceId, "error", error.message);

    revalidatePath("/admin/reglas");
    back(String(data), "ok", "Versión creada en borrador. Edita los puntos, valida y publica cuando esté lista.");
}

export async function saveRulePoints(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/reglas");

    const setId = String(formData.get("rule_set_id") ?? "");
    const rows: Record<string, unknown>[] = [];

    for (const [key, raw] of formData.entries()) {
        if (!key.startsWith("c_")) continue;

        const [, catId, subId, pl] = key.split("_");
        const points = Number(String(raw).replace(",", "."));

        if (!catId || !subId || !pl) back(setId, "error", "Clave de puntuación no válida.");
        if (!Number.isFinite(points) || points < 0 || points > 9999.99) {
            back(setId, "error", "Los puntos deben estar entre 0 y 9999,99.");
        }

        rows.push({
            rule_set_id: setId,
            category_id: catId,
            subgroup_id: subId,
            placement: Number(pl),
            points: Math.round(points * 100) / 100,
        });
    }

    if (rows.length === 0) back(setId, "error", "No hay puntuaciones para guardar.");

    const { error } = await supabase
        .from("scoring_rules")
        .upsert(rows, { onConflict: "rule_set_id,category_id,subgroup_id,placement" });

    if (error) back(setId, "error", error.message);

    revalidatePath("/admin/reglas");
    back(setId, "ok", "Puntuaciones guardadas.");
}

export async function publishRuleSet(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/reglas");

    const setId = String(formData.get("rule_set_id") ?? "");
    const effective = String(formData.get("effective_from") ?? "");
    const confirmed = formData.get("confirm") === "on";

    if (!confirmed) back(setId, "error", "Confirma la publicación.");
    if (!effective) back(setId, "error", "Indica la fecha de entrada en vigor.");

    const { error } = await supabase.rpc("publish_rule_set", {
        p_rule_set: setId,
        p_effective_from: effective,
    });

    if (error) back(setId, "error", error.message);

    revalidatePath("/admin/reglas");
    revalidatePath("/admin/ranking");
    back(setId, "ok", "Versión publicada. Se aplicará a las asignaciones que se hagan a partir de ahora.");
}