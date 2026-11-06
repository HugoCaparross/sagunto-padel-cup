"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/slug";
import { madridToIso } from "@/lib/time";
import { parseUrl } from "@/lib/validate";

const STATUSES = ["draft", "scheduled", "published", "archived"] as const;
type Status = (typeof STATUSES)[number];

function go(kind: "error" | "ok", msg: string, id?: string): never {
    redirect(`/admin/noticias${id ? `?edit=${id}&` : "?"}${kind}=${encodeURIComponent(msg)}`);
}

export async function saveNews(fd: FormData) {
    const { supabase, user } = await requireAdmin("/admin/noticias");

    const id = String(fd.get("id") ?? "");
    const title = String(fd.get("title") ?? "").trim();
    const excerpt = String(fd.get("excerpt") ?? "").trim() || null;
    const body = String(fd.get("body_markdown") ?? "").trim();
    const status = String(fd.get("status") ?? "draft") as Status;
    const cover = parseUrl(String(fd.get("cover_image_url") ?? ""));
    const eventId = String(fd.get("event_id") ?? "") || null;
    const pinned = fd.get("is_pinned") === "on";
    const scheduledAt = madridToIso(String(fd.get("scheduled_at") ?? ""));

    if (title.length < 5 || title.length > 140) {
        go("error", "El título debe tener entre 5 y 140 caracteres.", id);
    }
    if (body.length < 20) go("error", "El cuerpo de la noticia es demasiado corto.", id);
    if (!(STATUSES as readonly string[]).includes(status)) go("error", "Estado no válido.", id);
    if (!cover.valid) go("error", "La URL de la imagen no es válida.", id);
    if (status === "scheduled") {
        if (!scheduledAt) go("error", "Indica la fecha de publicación programada.", id);
        if (new Date(scheduledAt!) <= new Date()) go("error", "La fecha programada debe ser futura.", id);
    }

    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
        title,
        excerpt,
        body_markdown: body,
        cover_image_url: cover.value,
        status,
        is_pinned: pinned,
        event_id: eventId,
        scheduled_at: status === "scheduled" ? scheduledAt : null,
        published_at: status === "published" ? now : null,
    };

    if (id) {
        const { data: old } = await supabase.from("news").select("published_at").eq("id", id).single();
        if (status === "published") payload.published_at = old?.published_at ?? now;

        const { error } = await supabase.from("news").update(payload).eq("id", id);
        if (error) go("error", error.message, id);

        await supabase.rpc("log_audit", {
            p_action: "news.updated",
            p_entity_table: "news",
            p_entity_id: id,
            p_old: null,
            p_new: { status, is_pinned: pinned },
            p_reason: null,
        });

        revalidatePath("/admin/noticias");
        revalidatePath("/");
        go("ok", "Noticia guardada.", id);
    }

    payload.slug = slugify(title);
    payload.author_id = user.id;

    const { data: created, error } = await supabase.from("news").insert(payload).select("id").single();
    if (error || !created) go("error", error?.message ?? "No se pudo crear la noticia.");

    await supabase.rpc("log_audit", {
        p_action: "news.created",
        p_entity_table: "news",
        p_entity_id: created.id,
        p_old: null,
        p_new: { status, is_pinned: pinned },
        p_reason: null,
    });

    revalidatePath("/admin/noticias");
    revalidatePath("/");
    go("ok", "Noticia creada.", created.id);
}

export async function publishDueNews() {
    const { supabase } = await requireAdmin("/admin/noticias");

    const { data, error } = await supabase.rpc("publish_due_news");
    if (error) go("error", error.message);

    revalidatePath("/admin/noticias");
    revalidatePath("/");
    go("ok", `Noticias publicadas: ${data ?? 0}.`);
}