// Ruta: src/app/(private)/app/torneos/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function cancelarInscripcion(pairId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No has iniciado sesión" };

  const admin = createAdminClient();

  // Comprueba que el jugador pertenece a esa pareja antes de cancelar
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

  const { error: pairError } = await admin
    .from("pairs")
    .update({ estado: "incompleta" })
    .eq("id", pairId);
  if (pairError) return { ok: false, error: "No se ha podido cancelar la pareja" };

  const { error: registrationError } = await admin
    .from("registrations")
    .update({ estado: "cancelada" })
    .eq("pair_id", pairId);
  if (registrationError) return { ok: false, error: "No se ha podido cancelar la inscripción" };

  revalidatePath("/app/torneos");
  return { ok: true };
}
