"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { madridToIso } from "@/lib/time";
import { DEFAULT_STAGE_RULES, validateSets, type SetInput, type StageRules } from "@/lib/match-rules";

function fail(message: string, back = "/admin/resultados"): never {
    redirect(`${back}?error=${encodeURIComponent(message)}`);
}

export async function createMatch(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/resultados");

    const regA = String(formData.get("registration_a_id") ?? "");
    const regB = String(formData.get("registration_b_id") ?? "");
    const round = String(formData.get("round_name") ?? "").trim() || null;
    const court = String(formData.get("court_name") ?? "").trim() || null;
    const scheduledAt = madridToIso(String(formData.get("scheduled_at") ?? ""));

    if (!regA || !regB || regA === regB) fail("Selecciona dos parejas distintas.");

    const { data: regs } = await supabase
        .from("registrations")
        .select("id,status,event_category_id")
        .in("id", [regA, regB]);

    const a = regs?.find((r) => r.id === regA);
    const b = regs?.find((r) => r.id === regB);

    if (!a || !b) fail("Alguna pareja no existe.");
    if (a.status !== "confirmed" || b.status !== "confirmed") {
        fail("Solo se pueden programar partidos con parejas confirmadas.");
    }
    if (a.event_category_id !== b.event_category_id) {
        fail("Las dos parejas deben jugar en la misma prueba y categoría.");
    }

    let { data: stage } = await supabase
        .from("competition_stages")
        .select("id")
        .eq("event_category_id", a.event_category_id)
        .eq("stage_order", 1)
        .maybeSingle();

    if (!stage) {
        const { data: created, error: stageError } = await supabase
            .from("competition_stages")
            .insert({
                event_category_id: a.event_category_id,
                name: "Fase de grupos",
                stage_type: "group",
                stage_order: 1,
                status: "draft",
                rules_json: DEFAULT_STAGE_RULES,
            })
            .select("id")
            .single();

        if (stageError || !created) fail("No se pudo crear la fase de la categoría.");
        stage = created;
    }

    const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("stage_id", stage.id);

    const { data: match, error } = await supabase
        .from("matches")
        .insert({
            stage_id: stage.id,
            match_number: `M${(count ?? 0) + 1}`,
            round_name: round,
            registration_a_id: regA,
            registration_b_id: regB,
            court_name: court,
            scheduled_at: scheduledAt,
            status: "scheduled",
            created_by: user.id,
        })
        .select("id")
        .single();

    if (error || !match) fail("No se pudo crear el partido.");

    revalidatePath("/admin/resultados");
    redirect(`/admin/resultados/${match.id}`);
}

export async function saveResult(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/resultados");

    const id = String(formData.get("id") ?? "");
    const back = `/admin/resultados/${id}`;

    const { data: match } = await supabase
        .from("matches")
        .select("id,status,competition_stages(rules_json)")
        .eq("id", id)
        .single();

    if (!match) fail("Partido no encontrado.");
    if (match.status === "validated") {
        fail("El partido está validado. Revierte la validación antes de editar el resultado.", back);
    }

    const stageRules = (match as any).competition_stages?.rules_json ?? {};
    const rules: StageRules = { ...DEFAULT_STAGE_RULES, ...stageRules };

    const sets: SetInput[] = [];
    let ended = false;

    for (let n = 1; n <= 3; n++) {
        const a = String(formData.get(`s${n}a`) ?? "").trim();
        const b = String(formData.get(`s${n}b`) ?? "").trim();

        if (a === "" && b === "") {
            ended = true;
            continue;
        }
        if (ended) fail("Rellena los sets en orden.", back);

        const tbA = String(formData.get(`t${n}a`) ?? "").trim();
        const tbB = String(formData.get(`t${n}b`) ?? "").trim();

        sets.push({
            a: Number(a),
            b: Number(b),
            tbA: tbA === "" ? null : Number(tbA),
            tbB: tbB === "" ? null : Number(tbB),
        });
    }

    const check = validateSets(sets, rules);
    if (!check.ok) fail(check.error, back);

    await supabase.from("match_sets").delete().eq("match_id", id);

    const { error: setsError } = await supabase.from("match_sets").insert(
        sets.map((s, i) => {
            const tie = s.a === s.b;
            return {
                match_id: id,
                set_number: i + 1,
                score_a: s.a,
                score_b: s.b,
                tie_break_a: tie ? s.tbA : null,
                tie_break_b: tie ? s.tbB : null,
            };
        }),
    );
    if (setsError) fail("No se pudo guardar el resultado.", back);

    await supabase.from("matches").update({ status: "finished_pending_validation" }).eq("id", id);

    revalidatePath("/admin/resultados");
    redirect(back);
}

export async function validateMatch(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/resultados");
    const id = String(formData.get("id") ?? "");
    const back = `/admin/resultados/${id}`;

    const { error } = await supabase.rpc("validate_match", { p_match_id: id });
    if (error) fail(error.message, back);

    revalidatePath("/admin/resultados");
    revalidatePath("/admin/jugadores");
    revalidatePath("/admin");
    redirect(back);
}

export async function revertMatch(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/resultados");
    const id = String(formData.get("id") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();
    const back = `/admin/resultados/${id}`;

    const { error } = await supabase.rpc("revert_match", { p_match_id: id, p_reason: reason });
    if (error) fail(error.message, back);

    revalidatePath("/admin/resultados");
    revalidatePath("/admin/jugadores");
    revalidatePath("/admin");
    redirect(back);
}