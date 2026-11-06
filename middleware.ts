import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/admin", "/jugador"];

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    // Renueva la sesión si hace falta. No sustituir por getSession(): getUser() valida el token en servidor.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

    if (isProtected && !user) {
        const url = request.nextUrl.clone();
        url.pathname = "/acceso";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: ["/admin/:path*", "/jugador/:path*", "/acceso"],
};