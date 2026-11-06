"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";

export async function updateProfile(formData: FormData) {
    const { supabase, user } = await requireUser("/jugador/perfil");

    const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 80);
    const bio = String(formData.get("bio") ?? "").trim().slice(0, 500) || null;
    const isPublic = formData.get("is_public") === "on";

    if (!displayName) return;

    // Solo columnas concedidas al rol authenticated: display_name, avatar_url, bio, is_public.
    const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, bio, is_public: isPublic })
        .eq("id", user.id);

    if (error) throw new Error("No se pudo guardar el perfil.");

    revalidatePath("/jugador/perfil");
    revalidatePath("/jugador");
}