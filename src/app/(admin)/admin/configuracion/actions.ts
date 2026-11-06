"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";

function go(kind: "error" | "ok", msg: string): never {
    redirect(`/admin/configuracion?${kind}=${encodeURIComponent(msg)}`);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function saveSettings(fd: FormData) {
    const { supabase } = await requireAdmin("/admin/configuracion");

    const reason = String(fd.get("reason") ?? "").trim();
    const next: Record<string, unknown> = {
        site_name: String(fd.get("site_name") ?? "").trim(),
        contact_email: String(fd.get("contact_email") ?? "").trim(),
        contact_phone: String(fd.get("contact_phone") ?? "").trim(),
        maintenance_mode: fd.get("maintenance_mode") === "on",
    };

    if (String(next.site_name).length < 2) go("error", "El nombre del circuito es demasiado corto.");
    if (!EMAIL.test(String(next.contact_email))) go("error", "El correo de contacto no es válido.");

    const { data: rows } = await supabase.from("app_settings").select("key,value");
    const current: Record<string, unknown> = Object.fromEntries(
        (rows ?? []).map((r: any) => [r.key, r.value]),
    );

    const changed = Object.keys(next).filter(
        (k) => JSON.stringify(current[k]) !== JSON.stringify(next[k]),
    );

    if (changed.length === 0) go("ok", "No había cambios que guardar.");

    if (changed.includes("maintenance_mode") && reason.length < 5) {
        go("error", "Indica un motivo para cambiar el modo mantenimiento.");
    }

    for (const key of changed) {
        const { error } = await supabase.rpc("set_app_setting", {
            p_key: key,
            p_value: next[key],
            p_reason: reason || null,
        });
        if (error) go("error", error.message);
    }

    revalidatePath("/admin/configuracion");
    go("ok", `Ajustes guardados: ${changed.length}.`);
}

export async function grantAdmin(fd: FormData) {
    const { supabase } = await requireAdmin("/admin/configuracion");

    const email = String(fd.get("email") ?? "").trim();
    const reason = String(fd.get("reason") ?? "").trim();

    if (!EMAIL.test(email)) go("error", "Correo no válido.");

    const { error } = await supabase.rpc("grant_admin_role", { p_email: email, p_reason: reason });
    if (error) go("error", error.message);

    revalidatePath("/admin/configuracion");
    go("ok", "Rol de administrador concedido.");
}

export async function revokeAdmin(fd: FormData) {
    const { supabase } = await requireAdmin("/admin/configuracion");

    const userId = String(fd.get("user_id") ?? "");
    const reason = String(fd.get("reason") ?? "").trim();
    const confirmed = fd.get("confirm") === "on";

    if (!confirmed) go("error", "Confirma la retirada del rol.");

    const { error } = await supabase.rpc("revoke_admin_role", { p_user: userId, p_reason: reason });
    if (error) go("error", error.message);

    revalidatePath("/admin/configuracion");
    go("ok", "Rol de administrador retirado.");
}