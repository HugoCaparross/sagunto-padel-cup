"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { madridToIso } from "@/lib/time";
import { slugify } from "@/lib/slug";

const EVENT_STATUSES = [
    "draft", "published", "registration_open", "registration_closed",
    "in_progress", "completed", "postponed", "cancelled", "archived",
] as const;
type EventStatus = (typeof EVENT_STATUSES)[number];

function fail(message: string): never {
    redirect(`/admin/pruebas?error=${encodeURIComponent(message)}`);
}

export async function createEvent(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/pruebas");

    const seasonId = String(formData.get("season_id") ?? "");
    const eventNumber = Number(formData.get("event_number"));
    const name = String(formData.get("name") ?? "").trim();
    const status = String(formData.get("status") ?? "draft") as EventStatus;
    const capacity = formData.get("registration_capacity")
        ? Number(formData.get("registration_capacity"))
        : null;
    const categoryIds = formData.getAll("categories").map(String);

    if (!seasonId || !name) fail("Indica temporada y nombre.");
    if (!Number.isInteger(eventNumber) || eventNumber < 1 || eventNumber > 6) fail("El número de prueba debe ser del 1 al 6.");
    if (!EVENT_STATUSES.includes(status)) fail("Estado no válido.");
    if (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0)) fail("El cupo debe ser un número positivo.");
    if (categoryIds.length === 0) fail("Selecciona al menos una categoría.");

    const startsAt = madridToIso(String(formData.get("starts_at") ?? ""));
    const endsAt = madridToIso(String(formData.get("ends_at") ?? ""));
    const opensAt = madridToIso(String(formData.get("registration_opens_at") ?? ""));
    const closesAt = madridToIso(String(formData.get("registration_closes_at") ?? ""));

    const { data: event, error } = await supabase
        .from("events")
        .insert({
            season_id: seasonId,
            event_number: eventNumber,
            event_type: "regular",
            name,
            slug: slugify(name),
            starts_at: startsAt,
            ends_at: endsAt,
            registration_opens_at: opensAt,
            registration_closes_at: closesAt,
            registration_capacity: capacity,
            status,
            created_by: user.id,
        })
        .select("id")
        .single();

    if (error || !event) {
        fail("No se pudo crear la prueba. Comprueba que el número no esté ya usado en esa temporada y que las fechas sean coherentes.");
    }

    const { error: catError } = await supabase.from("event_categories").insert(
        categoryIds.map((category_id) => ({ event_id: event.id, category_id })),
    );
    if (catError) fail("La prueba se creó, pero no se pudieron asociar las categorías. Edítala de nuevo.");

    await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "event.created",
        entity_table: "events",
        entity_id: event.id,
        new_values: { name, status, season_id: seasonId, event_number: eventNumber },
    });

    revalidatePath("/admin/pruebas");
    revalidatePath("/admin");
    redirect("/admin/pruebas");
}

export async function changeEventStatus(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/pruebas");

    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "") as EventStatus;

    if (!id || !EVENT_STATUSES.includes(status)) fail("Datos no válidos.");

    const { data: current } = await supabase.from("events").select("status").eq("id", id).single();
    if (!current || current.status === status) return;

    const { error } = await supabase.from("events").update({ status }).eq("id", id);
    if (error) fail("No se pudo cambiar el estado.");

    await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "event.status_changed",
        entity_table: "events",
        entity_id: id,
        old_values: { status: current.status },
        new_values: { status },
    });

    revalidatePath("/admin/pruebas");
    revalidatePath("/admin");
}