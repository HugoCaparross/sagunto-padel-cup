"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

const VALID = ["pending", "confirmed", "waitlist", "cancelled", "rejected"] as const;
type Status = (typeof VALID)[number];

export async function changeRegistrationStatus(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/inscripciones");

    const id = String(formData.get("id") ?? "");
    const next = String(formData.get("status") ?? "") as Status;
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!id || !VALID.includes(next)) return;

    const { data: current } = await supabase
        .from("registrations")
        .select("id,status")
        .eq("id", id)
        .single();

    if (!current || current.status === next) return;

    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
        status: next,
        reviewed_by: user.id,
        reviewed_at: now,
    };
    if (notes) update.review_notes = notes;
    if (next === "cancelled") {
        update.cancelled_at = now;
        update.cancellation_reason = notes;
    }

    const { error } = await supabase.from("registrations").update(update).eq("id", id);
    if (error) throw new Error("No se pudo actualizar la inscripción.");

    await supabase.from("registration_status_history").insert({
        registration_id: id,
        old_status: current.status,
        new_status: next,
        notes,
        changed_by: user.id,
    });

    await supabase.rpc("log_audit", {
        p_action: "registration.status_changed",
        p_entity_table: "registrations",
        p_entity_id: id,
        p_old: { status: current.status },
        p_new: { status: next },
        p_reason: notes,
    });

    revalidatePath("/admin/inscripciones");
    revalidatePath("/admin");
}