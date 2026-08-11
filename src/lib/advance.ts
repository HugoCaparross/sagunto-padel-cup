// Ruta: src/lib/advance.ts

import type { SupabaseClient } from "@supabase/supabase-js";

// Empuja al ganador de un partido de cuadro a la siguiente ronda,
// o lo declara campeón del tramo si no hay siguiente partido.
export async function advanceWinner(
  admin: SupabaseClient,
  matchId: string,
  ganadorId: string
) {
  const { data: match, error: matchError } =
    await admin
      .from("matches")
      .select(
        "pair_1_id, pair_2_id, siguiente_match_id, siguiente_slot, tournament_id, categoria_id, tramo"
      )
      .eq("id", matchId)
      .maybeSingle();

  if (matchError) {
    console.error(
      "[advanceWinner] Error obteniendo partido:",
      matchError
    );
    return;
  }

  if (!match) {
    console.error(
      "[advanceWinner] Partido no encontrado:",
      matchId
    );
    return;
  }

  const ganadorPerteneceAlPartido =
    match.pair_1_id === ganadorId ||
    match.pair_2_id === ganadorId;

  if (!ganadorPerteneceAlPartido) {
    console.error(
      "[advanceWinner] El ganador indicado no pertenece al partido:",
      {
        matchId,
        ganadorId,
      }
    );
    return;
  }

  if (!match.siguiente_match_id) {
    const { error } = await admin
      .from("brackets")
      .update({
        campeon_pair_id: ganadorId,
      })
      .eq(
        "tournament_id",
        match.tournament_id
      )
      .eq(
        "categoria_id",
        match.categoria_id
      )
      .eq("tramo", match.tramo);

    if (error) {
      console.error(
        "[advanceWinner] Error guardando campeón del tramo:",
        error
      );
    }

    return;
  }

  if (
    match.siguiente_slot !== 1 &&
    match.siguiente_slot !== 2
  ) {
    console.error(
      "[advanceWinner] Slot de siguiente partido inválido:",
      {
        matchId,
        siguienteMatchId:
          match.siguiente_match_id,
        siguienteSlot:
          match.siguiente_slot,
      }
    );

    return;
  }

  const campo =
    match.siguiente_slot === 1
      ? "pair_1_id"
      : "pair_2_id";

  const { error } = await admin
    .from("matches")
    .update({
      [campo]: ganadorId,
    })
    .eq(
      "id",
      match.siguiente_match_id
    );

  if (error) {
    console.error(
      "[advanceWinner] Error avanzando ganador:",
      error
    );
  }
}