// Ruta: src/app/(private)/app/torneos/actions.ts — sustituye entero al archivo actual
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function cancelarInscripcion(pairId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No has iniciado sesión" };

  const admin = createAdminClient();

  const { data: player } = await admin
    .from("players")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const { data: pair } = await admin
    .from("pairs")
    .select("player_1_id, player_2_id")
    .eq("id", pairId)
    .single();

  if (!player || !pair || (pair.player_1_id !== player.id && pair.player_2_id !== player.id)) {
    return { ok: false, error: "No autorizado" };
  }

  const { error } = await admin.rpc("cancelar_inscripcion", { p_pair_id: pairId });
  if (error) return { ok: false, error: "No se ha podido cancelar la inscripción" };

  return { ok: true };
}