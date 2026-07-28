// Ruta: src/lib/supabase/admin.ts
// Solo usar en Server Actions / Route Handlers. NUNCA importar en un
// componente de cliente: ignora RLS por completo.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}