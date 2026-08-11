// Ruta: src/lib/supabase/server.ts
//
// Cliente de Supabase para Server Components,
// Route Handlers y Server Actions.
//
// Este cliente trabaja con las cookies de sesión
// gestionadas por Supabase SSR.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function createClient() {
  const cookieStore =
    await cookies();

  return createServerClient(
    getRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_URL"
    ),
    getRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    ),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(
          cookiesToSet
        ) {
          try {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {
            /*
             * Server Components no pueden escribir cookies
             * directamente. El proxy/middleware se encarga
             * del refresco de sesión cuando corresponde.
             */
          }
        },
      },
    }
  );
}