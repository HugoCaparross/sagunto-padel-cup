"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

type Table = "categories" | "subgroups";
const TABLES: Table[] = ["categories", "subgroups"];

function go(kind: "error" | "ok", msg: string): never {
    redirect(`/admin/categorias?${kind}=${encodeURIComponent(msg)}`);
}

function parseTable(raw: FormDataEntryValue | null): Table {
    const t = String(raw ?? "");
    if (!TABLES.includes(t as Table)) go("error", "Tabla no válida.");
    return t as Table;
}

function codeFrom(name: string) {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
}

export async function updateItem(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/categorias");

    const table = parseTable(formData.get("table"));
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const active = formData.get("is_active") === "on";

    if (!id) go("error", "Elemento no válido.");
    if (name.length < 2 || name.length > 60) go("error", "El nombre debe tener entre 2 y 60 caracteres.");

    const { data: old } = await supabase.from(table).select("name,is_active").eq("id", id).single();
    if (!old) go("error", "No se encuentra el elemento.");

    const { error } = await supabase.from(table).update({ name, is_active: active }).eq("id", id);
    if (error) {
        go("error", error.code === "23505" ? "Ya existe un elemento con ese nombre." : "No se pudo guardar.");
    }

    await supabase.rpc("log_audit", {
        p_action: `${table}.updated`,
        p_entity_table: table,
        p_entity_id: id,
        p_old: old,
        p_new: { name, is_active: active },
        p_reason: null,
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/admin/inscripciones");
    go("ok", "Cambios guardados.");
}

export async function moveItem(formData: FormData) {
    const { supabase } = await requireAdmin("/admin/categorias");

    const table = parseTable(formData.get("table"));
    const id = String(formData.get("id") ?? "");
    const direction = String(formData.get("direction") ?? "");

    if (direction !== "up" && direction !== "down") go("error", "Dirección no válida.");

    const { error } = await supabase.rpc(table === "categories" ? "move_category" : "move_subgroup", {
        p_id: id,
        p_direction: direction,
    });

    if (error) go("error", error.message);

    revalidatePath("/admin/categorias");
    go("ok", "Orden actualizado.");
}

export async function createItem(formData: FormData) {
    const { supabase, user } = await requireAdmin("/admin/categorias");

    const table = parseTable(formData.get("table"));
    const name = String(formData.get("name") ?? "").trim();

    if (name.length < 2 || name.length > 60) go("error", "El nombre debe tener entre 2 y 60 caracteres.");

    const code = codeFrom(name);
    if (!code) go("error", "El nombre no genera un código válido.");

    const { data: last } = await supabase
        .from(table)
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();

    const order = ((last as any)?.display_order ?? 0) + 1;

    const { data: created, error } = await supabase
        .from(table)
        .insert({ code, name, display_order: order, is_active: true })
        .select("id")
        .single();

    if (error || !created) {
        go("error", error?.code === "23505" ? "Ya existe un elemento con ese nombre o código." : "No se pudo crear.");
    }

    await supabase.rpc("log_audit", {
        p_action: `${table}.created`,
        p_entity_table: table,
        p_entity_id: (created as any).id,
        p_old: null,
        p_new: { name, code, display_order: order },
        p_reason: null,
    });

    revalidatePath("/admin/categorias");
    go("ok", "Creado. Recuerda que las reglas de puntuación necesitan puntos para los nuevos elementos activos.");
}