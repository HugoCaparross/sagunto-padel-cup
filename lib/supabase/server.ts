import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Cliente con la sesión del usuario. Respeta RLS.
// Úsalo en Server Components, Server Actions y Route Handlers.
export async function crearClienteServidor() {
    const almacen = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return almacen.getAll();
                },
                setAll(cookiesParaGuardar) {
                    try {
                        cookiesParaGuardar.forEach(({ name, value, options }) =>
                            almacen.set(name, value, options)
                        );
                    } catch {
                        // En Server Components las cookies son de solo lectura.
                        // El middleware refresca la sesión, así que aquí no hace falta.
                    }
                },
            },
        }
    );
}

// Cliente con la secret key. Salta RLS.
// Solo para tareas de organizador en el servidor (recálculo de ranking,
// importaciones, auditoría). Nunca importar en componentes cliente.
export function crearClienteAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}