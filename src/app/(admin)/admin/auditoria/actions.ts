"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

const SEVERITIES = ["low", "medium", "high"];

function go(kind: "error" | "ok", msg: string): never {
    redirect(`/admin/auditoria?${kind}=${encodeURIComponent(msg)}`);
}

export async function createIncident(fd: FormData) {
    const { supabase, user } = await requireAdmin("/admin/auditoria");

    const title = String(fd.get("title") ?? "").trim();
    const severity = String(fd.get("severity") ?? "");
    const description = String(fd.get("description") ?? "").trim() || null;

    if (title.length < 5 || title.length > 140) go("error", "El título debe tener entre 5 y 140 caracteres.");
    if (!SEVERITIES.includes(severity)) go("error", "Gravedad no válida.");

    const { data, error } = await supabase
        .from("incidents")
        .insert({ title, severity, description, created_by: user.id })
        .select("id")
        .single();

    if (error || !data) go("error", "No se pudo registrar la incidencia.");

    await supabase.rpc("log_audit", {
        p_action: "incident.created",
        p_entity_table: "incidents",
        p_entity_id: data.id,
        p_old: null,
        p_new: { title, severity },
        p_reason: null,
    });

    revalidatePath("/admin/auditoria");
    go("ok", "Incidencia registrada.");
}

export async function updateIncident(fd: FormData) {
    const { supabase, user } = await requireAdmin("/admin/auditoria");

    const id = String(fd.get("id") ?? "");
    const status = String(fd.get("status") ?? "");
    const note = String(fd.get("resolution_note") ?? "").trim();

    if (status !== "in_progress" && status !== "resolved") go("error", "Estado no válido.");
    if (status === "resolved" && note.length < 5) {
        go("error", "Para resolver una incidencia, explica cómo se ha solucionado.");
    }

    const patch =
        status === "resolved"
            ? {
                status,
                resolution_note: note,
                resolved_at: new Date().toISOString(),
                resolved_by: user.id,
            }
            : { status };

    const { error } = await supabase.from("incidents").update(patch).eq("id", id);
    if (error) go("error", "No se pudo actualizar la incidencia.");

    await supabase.rpc("log_audit", {
        p_action: "incident.updated",
        p_entity_table: "incidents",
        p_entity_id: id,
        p_old: null,
        p_new: { status },
        p_reason: status === "resolved" ? note : null,
    });

    revalidatePath("/admin/auditoria");
    go("ok", status === "resolved" ? "Incidencia resuelta." : "Incidencia en curso.");
}