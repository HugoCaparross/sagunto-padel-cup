// Ruta: src/lib/advance.ts
import { SupabaseClient } from "@supabase/supabase-js";

// Empuja al ganador de un partido de cuadro a la siguiente ronda,
// o lo declara campeón del tramo si no hay siguiente partido.
export async function advanceWinner(
  admin: SupabaseClient,
  matchId: string,
  ganadorId: string
) {
  const { data: match } = await admin
    .from("matches")
    .select("siguiente_match_id, siguiente_slot, tournament_id, categoria_id, tramo")
    .eq("id", matchId)
    .single();

  if (!match) return;

  if (!match.siguiente_match_id) {
    // No hay siguiente ronda: este partido era la final del tramo
    await admin
      .from("brackets")
      .update({ campeon_pair_id: ganadorId })
      .eq("tournament_id", match.tournament_id)
      .eq("categoria_id", match.categoria_id)
      .eq("tramo", match.tramo);
    return;
  }

  const campo = match.siguiente_slot === 1 ? "pair_1_id" : "pair_2_id";
  await admin
    .from("matches")
    .update({ [campo]: ganadorId })
    .eq("id", match.siguiente_match_id);
}