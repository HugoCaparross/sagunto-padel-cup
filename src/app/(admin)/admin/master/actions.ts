"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { madridToIso } from "@/lib/time";
import { slugify } from "@/lib/slug";
import { MASTER_EDITABLE, MASTER_LOCKED_EVENT_STATUS } from "@/lib/master";

function back(msg: string, kind: "error" | "ok", eventId?: string): never {
    const q = eventId ? `event=${eventId}&` : "";
    redirect(`/admin/master?${q}${kind}=${encodeURIComponent(msg)}`);
}

export async function createMasterFinal(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/master");

    const seasonId = String(formData.get("season_id") ?? "");
    const name = String(formData.get("name") ?? "").trim() || "Máster Final";
    const startsAt = madridToIso(String(formData.get("starts_at") ?? ""));

    if (!seasonId) back("Selecciona una temporada.", "error");

    const { data, error } = await supabase
        .from("events")
        .insert({
            season_id: seasonId,
            event_type: "master_final",
            event_number: null,
            name,
            slug: slugify(name),
            starts_at: startsAt,
            status: "draft",
            created_by: user.id,
        })
        .select("id")
        .single();

    if (error || !data) back("No se pudo crear el Máster. Puede que ya exista uno en esa temporada.", "error");

    revalidatePath("/admin/master");
    back("Máster Final creado.", "ok", data.id);
}

export async function recalculateCandidates(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/master");

    const eventId = String(formData.get("event_id") ?? "");
    const places = Number(String(formData.get("places") ?? "6"));
    const minEvents = Number(String(formData.get("min_events") ?? "1"));

    if (!Number.isInteger(places) || places < 1) back("Plazas no válidas.", "error", eventId);
    if (!Number.isInteger(minEvents) || minEvents < 0) back("Mínimo de pruebas no válido.", "error", eventId);

    const { data, error } = await supabase.rpc("compute_master_candidates", {
        p_event_id: eventId,
        p_places: places,
        p_min_events: minEvents,
    });

    if (error) back(error.message, "error", eventId);

    revalidatePath("/admin/master");
    back(`Candidatos calculados: ${data} jugadores evaluados.`, "ok", eventId);
}

export async function setQualificationStatus(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/master");

    const id = String(formData.get("id") ?? "");
    const eventId = String(formData.get("event_id") ?? "");
    const status = String(formData.get("status") ?? "");

    if (!MASTER_EDITABLE.includes(status)) back("Estado no válido.", "error", eventId);

    const { data: event } = await supabase.from("events").select("status").eq("id", eventId).single();
    if (event && MASTER_LOCKED_EVENT_STATUS.includes(event.status)) {
        back("La lista del Máster ya está cerrada.", "error", eventId);
    }

    const patch: Record<string, unknown> =
        status === "confirmed"
            ? { eligibility_status: status, confirmed_by: user.id, confirmed_at: new Date().toISOString() }
            : { eligibility_status: status, confirmed_by: null, confirmed_at: null };

    const { error } = await supabase.from("master_final_qualifications").update(patch).eq("id", id);
    if (error) back("No se pudo actualizar el estado.", "error", eventId);

    revalidatePath("/admin/master");
    back("Estado actualizado.", "ok", eventId);
}