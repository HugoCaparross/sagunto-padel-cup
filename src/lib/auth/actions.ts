"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const next = String(formData.get("next") ?? "");

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        redirect(`/acceso?error=credenciales${next ? `&next=${encodeURIComponent(next)}` : ""}`);
    }

    const { data: isAdmin } = await supabase.rpc("is_admin");
    const fallback = isAdmin ? "/admin" : "/jugador";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : fallback;

    redirect(safeNext);
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/acceso");
}