import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser(next = "/jugador") {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/acceso?next=${encodeURIComponent(next)}`);
    }

    return { supabase, user };
}

/** Comprueba el rol en servidor (función is_admin() con RLS). */
export async function requireAdmin(next = "/admin") {
    const { supabase, user } = await requireUser(next);

    const { data: isAdmin } = await supabase.rpc("is_admin");

    if (!isAdmin) {
        redirect("/jugador");
    }

    return { supabase, user };
}