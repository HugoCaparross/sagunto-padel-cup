// Ruta en el proyecto: src/middleware.ts
// Refresca la sesión de Supabase Auth en cada petición y protege
// las rutas privadas (/app/*) y de admin (/admin/*)

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPrivateRoute = request.nextUrl.pathname.startsWith("/app");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if ((isPrivateRoute || isAdminRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Nota: la comprobación de "es admin" (solo Hugo) se hace además
  // a nivel de base de datos con RLS, esto es solo la primera barrera

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};