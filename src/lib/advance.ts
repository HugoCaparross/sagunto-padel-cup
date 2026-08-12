// Ruta: src/lib/advance.ts

import type { SupabaseClient } from "@supabase/supabase-js";

export type AdvanceWinnerResult =
  | {
      ok: true;
      tipo: "avance" | "campeon";
      siguienteMatchId?: string;
    }
  | {
      ok: false;
      error: string;
    };

// Empuja al ganador de un partido de cuadro a la siguiente ronda,
// o lo declara campeón del tramo si no hay siguiente partido.
// La operación es idempotente para evitar duplicar o sobrescribir
// avances cuando un resultado se reprocesa.
export async function advanceWinner(
  admin: SupabaseClient,
  matchId: string,
  ganadorId: string,
): Promise<AdvanceWinnerResult> {
  if (!matchId || !ganadorId) {
    return {
      ok: false,
      error: "Partido o ganador no válido.",
    };
  }

  const { data: match, error: matchError } = await admin
    .from("matches")
    .select(
      "pair_1_id, pair_2_id, siguiente_match_id, siguiente_slot, tournament_id, categoria_id, tramo",
    )
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) {
    console.error("[advanceWinner] Error obteniendo partido:", matchError);

    return {
      ok: false,
      error: "No se ha podido consultar el partido.",
    };
  }

  if (!match) {
    return {
      ok: false,
      error: "El partido no existe.",
    };
  }

  if (match.pair_1_id !== ganadorId && match.pair_2_id !== ganadorId) {
    return {
      ok: false,
      error: "La pareja seleccionada no pertenece al partido.",
    };
  }

  if (!match.siguiente_match_id) {
    const { data: bracket, error: bracketError } = await admin
      .from("brackets")
      .select("campeon_pair_id")
      .eq("tournament_id", match.tournament_id)
      .eq("categoria_id", match.categoria_id)
      .eq("tramo", match.tramo)
      .maybeSingle();

    if (bracketError) {
      console.error("[advanceWinner] Error consultando campeón:", bracketError);

      return {
        ok: false,
        error: "No se ha podido consultar el estado del cuadro.",
      };
    }

    if (bracket?.campeon_pair_id && bracket.campeon_pair_id !== ganadorId) {
      return {
        ok: false,
        error: "El cuadro ya tiene otro campeón registrado.",
      };
    }

    const { error } = await admin
      .from("brackets")
      .update({
        campeon_pair_id: ganadorId,
      })
      .eq("tournament_id", match.tournament_id)
      .eq("categoria_id", match.categoria_id)
      .eq("tramo", match.tramo);

    if (error) {
      console.error(
        "[advanceWinner] Error guardando campeón del tramo:",
        error,
      );

      return {
        ok: false,
        error: "No se ha podido guardar el campeón del tramo.",
      };
    }

    return {
      ok: true,
      tipo: "campeon",
    };
  }

  if (match.siguiente_slot !== 1 && match.siguiente_slot !== 2) {
    return {
      ok: false,
      error: "La posición del siguiente partido no es válida.",
    };
  }

  const campo = match.siguiente_slot === 1 ? "pair_1_id" : "pair_2_id";

  const { data: siguiente, error: siguienteError } = await admin
    .from("matches")
    .select("pair_1_id, pair_2_id")
    .eq("id", match.siguiente_match_id)
    .maybeSingle();

  if (siguienteError) {
    console.error(
      "[advanceWinner] Error consultando siguiente partido:",
      siguienteError,
    );

    return {
      ok: false,
      error: "No se ha podido consultar el siguiente partido.",
    };
  }

  if (!siguiente) {
    return {
      ok: false,
      error: "El siguiente partido no existe.",
    };
  }

  const actual =
    campo === "pair_1_id" ? siguiente.pair_1_id : siguiente.pair_2_id;

  if (actual === ganadorId) {
    return {
      ok: true,
      tipo: "avance",
      siguienteMatchId: match.siguiente_match_id,
    };
  }

  if (actual) {
    return {
      ok: false,
      error: "El siguiente partido ya tiene ocupada esa posición.",
    };
  }

  const { error } = await admin
    .from("matches")
    .update({
      [campo]: ganadorId,
    })
    .eq("id", match.siguiente_match_id)
    .is(campo, null);

  if (error) {
    console.error("[advanceWinner] Error avanzando ganador:", error);

    return {
      ok: false,
      error: "No se ha podido avanzar al ganador.",
    };
  }

  return {
    ok: true,
    tipo: "avance",
    siguienteMatchId: match.siguiente_match_id,
  };
}
