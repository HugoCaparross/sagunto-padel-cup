import { crearClienteServidor } from "@/lib/supabase/server";

// Id del usuario con sesión, o null.
export async function usuarioActual(): Promise<string | null> {
    const supabase = await crearClienteServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
}

// Id del organizador con sesión, o null si no hay sesión o no es organizador.
// Comprueba el rol en el servidor: nunca se confía en lo que envía el cliente.
export async function exigirOrganizador(): Promise<string | null> {
    const supabase = await crearClienteServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", user.id)
        .single();

    return perfil?.rol === "organizador" ? user.id : null;
}