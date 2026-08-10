// Ruta: src/app/(private)/app/onboarding-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export async function marcarOnboardingCompletado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("players")
    .update({ onboarding_completado: true })
    .eq("auth_user_id", user.id);

  if (error) return { ok: false };
  return { ok: true };
}
