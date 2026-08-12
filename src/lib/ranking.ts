// Ruta: src/lib/ranking.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import { puntosPara, resultadoClave } from "@/lib/points-table";

type Tramo = "oro" | "plata" | "bronce";

const TRAMOS: readonly Tramo[] = ["oro", "plata", "bronce"];

type Bracket = {
  tramo: Tramo;
  campeon_pair_id: string | null;
};

type Partido = {
  fase: string;
  pair_1_id: string | null;
  pair_2_id: string | null;
  estado: string;
  resultado_json: {
    ganador_id?: string;
  } | null;
};

function esTramoValido(tramo: string): tramo is Tramo {
  return tramo === "oro" || tramo === "plata" || tramo === "bronce";
}

function add365Days(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T00:00:00.000Z`);

  if (Number.isNaN(fecha.getTime())) {
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
  }

  fecha.setUTCDate(fecha.getUTCDate() + 365);

  return fecha.toISOString().slice(0, 10);
}

export async function intentarCalcularRanking(
  admin: SupabaseClient,
  torneoId: string,
  categoriaId: string,
) {
  if (!torneoId || !categoriaId) {
    return;
  }

  const { data: brackets, error: bracketsError } = await admin
    .from("brackets")
    .select("tramo, campeon_pair_id")
    .eq("tournament_id", torneoId)
    .eq("categoria_id", categoriaId);

  if (bracketsError) {
    console.error("[ranking] Error obteniendo brackets:", bracketsError);
    return;
  }

  const bracketsValidos: Bracket[] = (brackets ?? [])
    .filter(
      (
        bracket,
      ): bracket is {
        tramo: string;
        campeon_pair_id: string | null;
      } => typeof bracket.tramo === "string",
    )
    .filter((bracket): bracket is Bracket => esTramoValido(bracket.tramo));

  const bracketsPorTramo = new Map<Tramo, Bracket>();

  for (const bracket of bracketsValidos) {
    bracketsPorTramo.set(bracket.tramo, bracket);
  }

  if (TRAMOS.some((tramo) => !bracketsPorTramo.has(tramo))) {
    return;
  }

  if (TRAMOS.some((tramo) => !bracketsPorTramo.get(tramo)?.campeon_pair_id)) {
    return;
  }

  const { data: categoria, error: categoriaError } = await admin
    .from("categories")
    .select("nivel_orden")
    .eq("id", categoriaId)
    .maybeSingle();

  if (categoriaError) {
    console.error("[ranking] Error obteniendo categoría:", categoriaError);
    return;
  }

  if (
    !categoria ||
    !Number.isInteger(categoria.nivel_orden) ||
    categoria.nivel_orden < 1 ||
    categoria.nivel_orden > 4
  ) {
    console.error("[ranking] Categoría sin nivel_orden válido:", categoriaId);
    return;
  }

  const { data: torneo, error: torneoError } = await admin
    .from("tournaments")
    .select("fecha_inicio")
    .eq("id", torneoId)
    .maybeSingle();

  if (torneoError) {
    console.error("[ranking] Error obteniendo torneo:", torneoError);
    return;
  }

  const fecha = torneo?.fecha_inicio ?? new Date().toISOString().slice(0, 10);

  const fechaCaducidad = add365Days(fecha);

  /*
   * El ranking vigente es móvil: cada punto dura
   * exactamente 365 días desde la fecha de la prueba.
   *
   * El cálculo de un mismo torneo/categoría debe ser
   * idempotente para no duplicar puntos si un resultado
   * provoca más de una ejecución.
   */
  const { data: yaCalculado, error: yaCalculadoError } = await admin
    .from("ranking_points")
    .select("id")
    .eq("tournament_id", torneoId)
    .eq("categoria_id", categoriaId)
    .limit(1);

  if (yaCalculadoError) {
    console.error(
      "[ranking] Error comprobando cálculo previo:",
      yaCalculadoError,
    );
    return;
  }

  if (yaCalculado && yaCalculado.length > 0) {
    return;
  }

  for (const tramo of TRAMOS) {
    const bracket = bracketsPorTramo.get(tramo);

    if (!bracket?.campeon_pair_id) {
      continue;
    }

    const { data: partidos, error: partidosError } = await admin
      .from("matches")
      .select("fase, pair_1_id, pair_2_id, estado, resultado_json")
      .eq("tournament_id", torneoId)
      .eq("categoria_id", categoriaId)
      .eq("tramo", tramo);

    if (partidosError) {
      console.error("[ranking] Error obteniendo partidos:", {
        tramo,
        error: partidosError,
      });
      return;
    }

    const partidosValidos = (partidos ?? []) as Partido[];

    const pairIds = new Set<string>();

    for (const partido of partidosValidos) {
      if (partido.pair_1_id) {
        pairIds.add(partido.pair_1_id);
      }

      if (partido.pair_2_id) {
        pairIds.add(partido.pair_2_id);
      }
    }

    for (const pairId of pairIds) {
      const esCampeon = pairId === bracket.campeon_pair_id;

      let rondaEliminado: string | undefined;

      if (!esCampeon) {
        const derrota = partidosValidos.find((partido) => {
          if (partido.estado !== "finalizado") {
            return false;
          }

          const pertenece =
            partido.pair_1_id === pairId || partido.pair_2_id === pairId;

          if (!pertenece) {
            return false;
          }

          return partido.resultado_json?.ganador_id !== pairId;
        });

        rondaEliminado = derrota?.fase;
      }

      const clave = resultadoClave(tramo, esCampeon, rondaEliminado);

      const puntos = puntosPara(clave, categoria.nivel_orden);

      if (puntos <= 0) {
        continue;
      }

      const { data: pair, error: pairError } = await admin
        .from("pairs")
        .select("player_1_id, player_2_id")
        .eq("id", pairId)
        .maybeSingle();

      if (pairError) {
        console.error("[ranking] Error obteniendo pareja:", {
          pairId,
          error: pairError,
        });
        return;
      }

      if (!pair) {
        console.error("[ranking] Pareja no encontrada:", pairId);
        return;
      }

      const jugadoresUnicos = Array.from(
        new Set(
          [pair.player_1_id, pair.player_2_id].filter(
            (playerId): playerId is string => Boolean(playerId),
          ),
        ),
      );

      if (jugadoresUnicos.length === 0) {
        console.error("[ranking] Pareja sin jugadores:", pairId);
        return;
      }

      for (const playerId of jugadoresUnicos) {
        const { error: insertError } = await admin
          .from("ranking_points")
          .insert({
            player_id: playerId,
            tournament_id: torneoId,
            categoria_id: categoriaId,
            puntos_obtenidos: puntos,
            ronda_alcanzada: clave,
            fecha,
            fecha_caducidad: fechaCaducidad,
          });

        if (insertError) {
          console.error("[ranking] Error insertando puntos:", {
            playerId,
            pairId,
            torneoId,
            categoriaId,
            tramo,
            error: insertError,
          });
          return;
        }
      }
    }
  }
}
