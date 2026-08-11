// Ruta: src/lib/supabase/admin.ts
//
// SOLO usar en Server Actions / Route Handlers / código servidor.
// NUNCA importar este cliente desde un Client Component.
//
// El service role bypassa RLS. Su clave nunca debe exponerse
// al navegador.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

export function createAdminClient() {
  const url =
    getRequiredEnv(
      "NEXT_PUBLIC_SUPABASE_URL"
    );

  const serviceRoleKey =
    getRequiredEnv(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

  return createSupabaseClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}