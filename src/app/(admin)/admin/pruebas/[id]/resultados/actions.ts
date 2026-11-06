"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { PLACEMENT_CODES } from "@/lib/placements";

function back(eventId: string, kind: "error" | "ok", msg: string): never {
    redirect(`/admin/pruebas/${eventId}/resultados?${kind}=${encodeURIComponent(msg)}`);
}

export async function saveEventResults(formData: FormData) {
    const { supabase, user } = await requireAdmin();
    const eventId = String(formData.get("event_id") ?? "");
    const ids = formData.getAll("registration_ids").map(String);

    const { data: active } = await supabase
        .from("event_point_batches")
        .select("id")
        .eq("event_id", eventId)
        .eq("status", "active")
        .maybeSingle();

    if (active) {
        back(eventId, "error", "Hay puntos asignados. Revierte la asignación antes de cambiar los resultados.");
    }

    for (const regId of ids) {
        const sub = String(formData.get(`sub_${regId}`) ?? "");
        const pl = String(formData.get(`pl_${regId}`) ?? "");

        if (!sub || !pl) {
            await supabase.from("registration_results").delete().eq("registration_id", regId);
            continue;
        }

        const placement = Number(pl);
        if (!PLACEMENT_CODES.includes(placement)) {
            back(eventId, "error", "Posición no válida.");
        }

        const { error } = await supabase.from("registration_results").upsert(
            {
                registration_id: regId,
                event_id: eventId,
                subgroup_id: sub,
                placement,
                set_by: user.id,
                set_at: new Date().toISOString(),
            },
            { onConflict: "registration_id" },
        );

        if (error) back(eventId, "error", "No se pudo guardar un resultado.");
    }

    revalidatePath(`/admin/pruebas/${eventId}/resultados`);
    back(eventId, "ok", "Resultados guardados.");
}

export async function awardEventPoints(formData: FormData) {
    const { supabase } = await requireAdmin();
    const eventId = String(formData.get("event_id") ?? "");

    const { data, error } = await supabase.rpc("award_event_points", { p_event_id: eventId });
    if (error) back(eventId, "error", error.message);

    revalidatePath("/admin/jugadores");
    revalidatePath("/admin");
    back(eventId, "ok", `Puntos asignados: ${data} movimientos.`);
}

export async function revertEventPoints(formData: FormData) {
    const { supabase } = await requireAdmin();
    const eventId = String(formData.get("event_id") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();

    const { data, error } = await supabase.rpc("revert_event_points", {
        p_event_id: eventId,
        p_reason: reason,
    });
    if (error) back(eventId, "error", error.message);

    revalidatePath("/admin/jugadores");
    revalidatePath("/admin");
    back(
        eventId,
        "ok",
        `Puntos revertidos: ${data} movimientos. Corrige los resultados y vuelve a asignar.`,
    );
}