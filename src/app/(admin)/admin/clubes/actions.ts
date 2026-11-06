"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/slug";
import { parseUrl } from "@/lib/validate";
import { ORGANIZER_ROLES } from "@/lib/organizations";

function go(kind: "error" | "ok", msg: string, opts: { id?: string; event?: string } = {}): never {
    const q = [opts.id ? `edit=${opts.id}` : "", opts.event ? `event=${opts.event}` : ""]
        .filter(Boolean)
        .join("&");
    redirect(`/admin/clubes${q ? `?${q}&` : "?"}${kind}=${encodeURIComponent(msg)}`);
}

export async function saveClub(fd: FormData) {
    const { supabase } = await requireAdmin("/admin/clubes");

    const id = String(fd.get("id") ?? "");
    const name = String(fd.get("name") ?? "").trim();
    const website = parseUrl(String(fd.get("website_url") ?? ""));
    const logo = parseUrl(String(fd.get("logo_url") ?? ""));

    if (name.length < 2 || name.length > 80) {
        go("error", "El nombre debe tener entre 2 y 80 caracteres.", { id });
    }
    if (!website.valid) go("error", "La web debe empezar por http:// o https://.", { id });
    if (!logo.valid) go("error", "La URL del logo no es válida.", { id });

    const fields = {
        name,
        city: String(fd.get("city") ?? "").trim() || null,
        address: String(fd.get("address") ?? "").trim() || null,
        description: String(fd.get("description") ?? "").trim() || null,
        website_url: website.value,
        logo_url: logo.value,
        display_order: Number(fd.get("display_order") ?? 0) || 0,
        is_organizer: fd.get("is_organizer") === "on",
        is_published: fd.get("is_published") === "on",
    };

    if (id) {
        const { error } = await supabase.from("clubs").update(fields).eq("id", id);
        if (error) {
            go("error", error.code === "23505" ? "Ya existe un club con ese nombre." : "No se pudo guardar el club.", { id });
        }
        await supabase.rpc("log_audit", {
            p_action: "club.updated",
            p_entity_table: "clubs",
            p_entity_id: id,
            p_old: null,
            p_new: fields,
            p_reason: null,
        });
        revalidatePath("/admin/clubes");
        go("ok", "Club guardado.", { id });
    }

    const { data: created, error } = await supabase
        .from("clubs")
        .insert({ ...fields, slug: slugify(name) })
        .select("id")
        .single();

    if (error || !created) {
        go("error", error?.code === "23505" ? "Ya existe un club con ese nombre." : "No se pudo crear el club.");
    }

    await supabase.rpc("log_audit", {
        p_action: "club.created",
        p_entity_table: "clubs",
        p_entity_id: created.id,
        p_old: null,
        p_new: fields,
        p_reason: null,
    });

    revalidatePath("/admin/clubes");
    go("ok", "Club creado.", { id: created.id });
}

export async function attachClubToEvent(fd: FormData) {
    const { supabase } = await requireAdmin("/admin/clubes");

    const eventId = String(fd.get("event_id") ?? "");
    const clubId = String(fd.get("club_id") ?? "");
    const role = String(fd.get("organizer_role") ?? "");
    const order = Number(fd.get("display_order") ?? 0) || 0;

    if (!eventId || !clubId) go("error", "Selecciona prueba y club.", { event: eventId });
    if (!(ORGANIZER_ROLES as readonly string[]).includes(role)) {
        go("error", "Rol no válido.", { event: eventId });
    }

    const { error } = await supabase.from("event_organizers").upsert(
        { event_id: eventId, club_id: clubId, organizer_role: role, display_order: order },
        { onConflict: "event_id,club_id" },
    );

    if (error) {
        go(
            "error",
            error.code === "23505"
                ? "Esta prueba ya tiene un organizador principal. Cambia el anterior a otro rol."
                : "No se pudo asociar el club.",
            { event: eventId },
        );
    }

    revalidatePath("/admin/clubes");
    revalidatePath("/");
    go("ok", "Club asociado a la prueba.", { event: eventId });
}

export async function detachClubFromEvent(fd: FormData) {
    const { supabase } = await requireAdmin("/admin/clubes");

    const eventId = String(fd.get("event_id") ?? "");
    const clubId = String(fd.get("club_id") ?? "");

    const { error } = await supabase
        .from("event_organizers")
        .delete()
        .eq("event_id", eventId)
        .eq("club_id", clubId);

    if (error) go("error", "No se pudo quitar el club.", { event: eventId });

    revalidatePath("/admin/clubes");
    revalidatePath("/");
    go("ok", "Club quitado de la prueba.", { event: eventId });
}