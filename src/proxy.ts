// Ruta: src/proxy.ts
//
// Next.js 16 utiliza proxy.ts en lugar de middleware.ts.
//
// Este archivo protege:
//   /app/*
//   /admin/*
//
// La autorización específica de administrador continúa
// correspondiendo al servidor y a requireAdmin()/esAdmin().
// El proxy no debe sustituir esa comprobación.

import {
  createServerClient,
} from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

function redirectToLogin(
  request: NextRequest
) {
  const url =
    request.nextUrl.clone();

  url.pathname = "/login";

  /*
   * Conservamos la URL solicitada para que el flujo
   * de autenticación pueda recuperarla posteriormente
   * si la página de login lo utiliza.
   */
  url.searchParams.set(
    "next",
    request.nextUrl.pathname +
      request.nextUrl.search
  );

  return NextResponse.redirect(
    url
  );
}

function getRequiredEnv(
  name: string
): string {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `${name} no está configurada.`
    );
  }

  return value;
}

export async function proxy(
  request: NextRequest
) {
  let response =
    NextResponse.next({
      request,
    });

  const supabase =
    createServerClient(
      getRequiredEnv(
        "NEXT_PUBLIC_SUPABASE_URL"
      ),
      getRequiredEnv(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      ),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value
                );
              }
            );

            response =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                response.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );
          },
        },
      }
    );

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  const pathname =
    request.nextUrl.pathname;

  const isPrivateRoute =
    pathname === "/app" ||
    pathname.startsWith(
      "/app/"
    );

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith(
      "/admin/"
    );

  if (
    (isPrivateRoute ||
      isAdminRoute) &&
    !user
  ) {
    return redirectToLogin(
      request
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/app/:path*",
    "/admin/:path*",
  ],
};