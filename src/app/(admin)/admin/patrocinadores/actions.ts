"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/slug";
import { parseUrl } from "@/lib/validate";
import { SPONSOR_TYPES } from "@/lib/organizations";

function go(kind: "error" | "ok", msg: string, opts: { id?: string; event?: string } = {}): never {
    const q = [opts.id ? `edit=${opts.id}` : "", opts.event ? `event=${opts.event}` : ""]
        .filter(Boolean)
        .join("&");
    redirect(`/admin/patrocinadores${q ? `?${q}&` : "?"}${kind}=${encodeURIComponent(msg)}`);
}

export async function saveSponsor(fd: FormData) {
    const { supabase } = await requireAdmin("/admin/patrocinadores");

    const id = String(fd.get("id") ?? "");
    const name = String(fd.get("name") ?? "").trim();
    const type = String(fd.get("sponsor_type") ?? "");
    const website = parseUrl(String(fd.get("website_url") ?? ""));
    const logo = parseUrl(String(fd.get("logo_url") ?? ""));

    if (name.length < 2 || name.length > 80) {
        go("error", "El nombre debe tener entre 2 y 80 caracteres.", { id });
    }
    if (!(SPONSOR_TYPES as readonly string[]).includes(type)) {
        go("error", "Tipo no válido.", { id });
    }
    if (!website.valid) go("error", "La web debe empezar por http:// o https://.", { id });
    if (!logo.valid) go("error", "La URL del logo no es válida.", { id });

    const fields = {
        name,
        sponsor_type: type,
        description: String(fd.get("description") ?? "").trim() || null,
        website_url: website.value,
        logo_url: logo.value,
        display_order: Number(fd.get("display_order") ?? 0) || 0,
        is_published: fd.get("is_published") === "on",
    };

    if (id) {
        const { error } = await supabase.from("sponsors").update(fields).eq("id", id);
        if (error) {
            go("error", error.code === "23505" ? "Ya existe un patrocinador con ese nombre." : "No se pudo guardar.", { id });
        }
        await supabase.rpc("log_audit", {
            p_action: "sponsor.updated",
            p_entity_table: "sponsors",
            p_entity_id: id,
            p_old: null,
            p_new: fields,
            p_reason: null,
        });
        revalidatePath("/admin/patrocinadores");
        go("ok", "Patrocinador guardado.", { id });
    }

    const { data: created, error } = await supabase
        .from("sponsors")
        .insert({ ...fields, slug: slugify(name) })
        .select("id")
        .single();

    if (error || !created) {
        go("error", error?.code === "23505" ? "Ya existe un patrocinador con ese nombre." : "No se pudo crear.");
    }

    await supabase.rpc("log_audit", {
        p_action: "sponsor.created",
        p_entity_table: "sponsors",
        p_entity_id: created.id,
        p_old: null,
        p_new: fields,
        p_reason: null,
    });

    revalidatePath("/admin/patrocinadores");
    go("ok", "Patrocinador creado.", { id: created.id });
}

export async function attachSponsorToEvent(fd: FormData) {
    const { supabase } = await requireAdmin("/admin/patrocinadores");

    const eventId = String(fd.get("event_id") ?? "");
    const sponsorId = String(fd.get("sponsor_id") ?? "");
    const placement = String(fd.get("placement") ?? "").trim().slice(0, 40) || null;
    const order = Number(fd.get("display_order") ?? 0) || 0;

    if (!eventId || !sponsorId) go("error", "Selecciona prueba y patrocinador.", { event: eventId });

    const { error } = await supabase.from("event_sponsors").upsert(
        { event_id: eventId, sponsor_id: sponsorId, placement, display_order: order },
        { onConflict: "event_id,sponsor_id" },
    );

    if (error) go("error", "No se pudo asociar el patrocinador.", { event: eventId });

    revalidatePath("/admin/patrocinadores");
    revalidatePath("/");
    go("ok", "Patrocinador asociado a la prueba.", { event: eventId });
}

export async function detachSponsorFromEvent(fd: FormData) {
    const { supabase } = await requireAdmin("/admin/patrocinadores");

    const eventId = String(fd.get("event_id") ?? "");
    const sponsorId = String(fd.get("sponsor_id") ?? "");

    const { error } = await supabase
        .from("event_sponsors")
        .delete()
        .eq("event_id", eventId)
        .eq("sponsor_id", sponsorId);

    if (error) go("error", "No se pudo quitar el patrocinador.", { event: eventId });

    revalidatePath("/admin/patrocinadores");
    revalidatePath("/");
    go("ok", "Patrocinador quitado de la prueba.", { event: eventId });
}