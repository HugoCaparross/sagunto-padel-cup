// Ruta: src/lib/supabase/client.ts
//
// Cliente de Supabase para Client Components.
// Este cliente utiliza la anon key y respeta RLS.

import { createBrowserClient } from "@supabase/ssr";

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

export function createClient() {
  return createBrowserClient(
    getRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_URL"
    ),
    getRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  );
}