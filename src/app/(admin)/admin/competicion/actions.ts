"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

function back(eventId: string, kind: "error" | "ok", msg: string): never {
    redirect(`/admin/competicion?prueba=${eventId}&tab=presentacion&${kind}=${encodeURIComponent(msg)}`);
}

/** Presencia: solo la organización, una sola vez (la función lo impone en servidor). */
export async function markPresence(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/competicion");
    const eventId = String(formData.get("event_id") ?? "");
    const regId = String(formData.get("registration_id") ?? "");

    if (!regId) back(eventId, "error", "Pareja no válida.");

    const { error } = await supabase.rpc("mark_presence", { p_registration: regId });
    if (error) back(eventId, "error", error.message);

    revalidatePath("/admin/competicion");
    back(eventId, "ok", "Pareja marcada como presente.");
}

export async function assignCourt(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/competicion");
    const eventId = String(formData.get("event_id") ?? "");
    const matchId = String(formData.get("match_id") ?? "");
    const court = String(formData.get("court_name") ?? "").trim();

    if (!matchId || !court) back(eventId, "error", "Selecciona una pista.");

    const { error } = await supabase.from("matches").update({ court_name: court }).eq("id", matchId);
    if (error) back(eventId, "error", error.message);

    revalidatePath("/admin/competicion");
    back(eventId, "ok", `Pista asignada: ${court}.`);
}

export async function addCourt(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/competicion");
    const eventId = String(formData.get("event_id") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    if (name.length < 1 || name.length > 40) {
        back(eventId, "error", "El nombre de la pista debe tener entre 1 y 40 caracteres.");
    }

    const { count } = await supabase
        .from("event_courts")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId);

    const { error } = await supabase
        .from("event_courts")
        .insert({ event_id: eventId, name, position: (count ?? 0) + 1 });

    if (error) {
        back(
            eventId,
            "error",
            error.code === "23505" ? "Ya existe una pista con ese nombre en esta prueba." : "No se pudo añadir la pista.",
        );
    }

    revalidatePath("/admin/competicion");
    back(eventId, "ok", `Pista añadida: ${name}.`);
}