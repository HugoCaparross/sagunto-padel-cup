// Ruta: src/lib/advance.ts

import type { SupabaseClient } from "@supabase/supabase-js";

export type AdvanceWinnerResult =
  | {
      ok: true;
      tipo: "campeon" | "avance";
      siguienteMatchId?: string;
    }
  | {
      ok: false;
      error: string;
    };

// Empuja al ganador de un partido de cuadro a la siguiente ronda,
// o lo declara campeón del tramo si no hay siguiente partido.
// La operación es idempotente: volver a registrar el mismo ganador
// no debe sobrescribir una pareja distinta que ya haya avanzado.
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

  const { data: match, error: matchError } =
    await admin
      .from("matches")
      .select(
        "pair_1_id, pair_2_id, siguiente_match_id, siguiente_slot, tournament_id, categoria_id, tramo",
      )
      .eq("id", matchId)
      .maybeSingle();

  if (matchError) {
    console.error(
      "[advanceWinner] Error obteniendo partido:",
      matchError,
    );

    return {
      ok: false,
      error: "No se ha podido consultar el partido.",
    };
  }

  if (!match) {
    console.error(
      "[advanceWinner] Partido no encontrado:",
      matchId,
    );

    return {
      ok: false,
      error: "El partido no existe.",
    };
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
      },
    );

    return {
      ok: false,
      error:
        "La pareja seleccionada no pertenece a este partido.",
    };
  }

  if (!match.siguiente_match_id) {
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
        error:
          "No se ha podido guardar el campeón del tramo.",
      };
    }

    return {
      ok: true,
      tipo: "campeon",
    };
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
      },
    );

    return {
      ok: false,
      error:
        "La posición del siguiente partido no es válida.",
    };
  }

  const siguienteCampo =
    match.siguiente_slot === 1
      ? "pair_1_id"
      : "pair_2_id";

  const {
    data: siguiente,
    error: siguienteError,
  } = await admin
    .from("matches")
    .select("pair_1_id, pair_2_id")
    .eq(
      "id",
      match.siguiente_match_id,
    )
    .maybeSingle();

  if (siguienteError) {
    console.error(
      "[advanceWinner] Error obteniendo siguiente partido:",
      siguienteError,
    );

    return {
      ok: false,
      error:
        "No se ha podido consultar el siguiente partido.",
    };
  }

  if (!siguiente) {
    return {
      ok: false,
      error:
        "El siguiente partido no existe.",
    };
  }

  const valorActual =
    siguienteCampo === "pair_1_id"
      ? siguiente.pair_1_id
      : siguiente.pair_2_id;

  if (
    valorActual &&
    valorActual !== ganadorId
  ) {
    console.error(
      "[advanceWinner] El slot siguiente ya está ocupado por otra pareja:",
      {
        matchId,
        siguienteMatchId:
          match.siguiente_match_id,
        siguienteSlot:
          match.siguiente_slot,
        valorActual,
        ganadorId,
      },
    );

    return {
      ok: false,
      error:
        "El siguiente partido ya tiene una pareja asignada en esa posición.",
    };
  }

  if (
    valorActual === ganadorId
  ) {
    return {
      ok: true,
      tipo: "avance",
      siguienteMatchId:
        match.siguiente_match_id,
    };
  }

  const { error } = await admin
    .from("matches")
    .update({
      [siguienteCampo]: ganadorId,
    })
    .eq(
      "id",
      match.siguiente_match_id,
    )
    .eq(
      siguienteCampo,
      null,
    );

  if (error) {
    console.error(
      "[advanceWinner] Error avanzando ganador:",
      error,
    );

    return {
      ok: false,
      error:
        "No se ha podido avanzar al ganador.",
    };
  }

  return {
    ok: true,
    tipo: "avance",
    siguienteMatchId:
      match.siguiente_match_id,
  };
}