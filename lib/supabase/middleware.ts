import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function actualizarSesion(request: NextRequest) {
    let respuesta = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesParaGuardar) {
                    cookiesParaGuardar.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    respuesta = NextResponse.next({ request });
                    cookiesParaGuardar.forEach(({ name, value, options }) =>
                        respuesta.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // getUser() valida el token contra el servidor de Supabase.
    // No uses getSession() para decidir acceso: puede falsificarse.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return { respuesta, user, supabase };
}