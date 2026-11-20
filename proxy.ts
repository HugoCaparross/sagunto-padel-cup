import { NextResponse, type NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/middleware";

const RUTAS_JUGADOR = ["/cuenta", "/inscribirse", "/buscar-pareja"];
const RUTAS_ADMIN = ["/admin"];
const RUTAS_SOLO_INVITADO = ["/login", "/registro", "/recuperar"];

export async function proxy(request: NextRequest) {
    const { respuesta, user, supabase } = await actualizarSesion(request);
    const ruta = request.nextUrl.pathname;

    const empiezaPor = (lista: string[]) =>
        lista.some((r) => ruta === r || ruta.startsWith(r + "/"));

    // 1. Rutas que requieren sesión
    if ((empiezaPor(RUTAS_JUGADOR) || empiezaPor(RUTAS_ADMIN)) && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("siguiente", ruta);
        return NextResponse.redirect(url);
    }

    // 2. Rutas solo para organizador
    if (empiezaPor(RUTAS_ADMIN)) {
        const { data: perfil } = await supabase
            .from("perfiles")
            .select("rol")
            .eq("id", user!.id)
            .single();

        if (perfil?.rol !== "organizador") {
            const url = request.nextUrl.clone();
            url.pathname = "/cuenta";
            return NextResponse.redirect(url);
        }
    }

    // 3. Usuarios con sesión no deben ver login, registro ni recuperación
    if (empiezaPor(RUTAS_SOLO_INVITADO) && user) {
        const url = request.nextUrl.clone();
        url.pathname = "/cuenta";
        return NextResponse.redirect(url);
    }

    return respuesta;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};