// Ruta: src/lib/ranking.ts — sustituye entero al archivo actual
import { SupabaseClient } from "@supabase/supabase-js";
import { puntosPara, resultadoClave } from "@/lib/points-table";
import { evaluarInsignias } from "@/lib/badges";

export async function intentarCalcularRanking(
  admin: SupabaseClient,
  torneoId: string,
  categoriaId: string
) {
  const { data: brackets } = await admin
    .from("brackets")
    .select("tramo, campeon_pair_id")
    .eq("tournament_id", torneoId)
    .eq("categoria_id", categoriaId);

  const tramos = ["oro", "plata", "bronce"] as const;
  const existentes = brackets?.filter((b) => tramos.includes(b.tramo as typeof tramos[number])) ?? [];

  if (!existentes.length || existentes.some((b) => !b.campeon_pair_id)) {
    return;
  }

  const { data: categoria } = await admin
    .from("categories")
    .select("nivel_orden")
    .eq("id", categoriaId)
    .single();
  if (!categoria) return;

  const { data: torneo } = await admin
    .from("tournaments")
    .select("fecha_inicio")
    .eq("id", torneoId)
    .single();

  const { data: yaCalculado } = await admin
    .from("ranking_points")
    .select("id")
    .eq("tournament_id", torneoId)
    .eq("categoria_id", categoriaId)
    .limit(1);
  if (yaCalculado?.length) return;

  const jugadoresAfectados = new Set<string>();

  for (const bracket of existentes) {
    const { data: partidos } = await admin
      .from("matches")
      .select("fase, pair_1_id, pair_2_id, estado, resultado_json")
      .eq("tournament_id", torneoId)
      .eq("categoria_id", categoriaId)
      .eq("tramo", bracket.tramo);

    const pairIds = new Set<string>();
    partidos?.forEach((m) => {
      if (m.pair_1_id) pairIds.add(m.pair_1_id);
      if (m.pair_2_id) pairIds.add(m.pair_2_id);
    });

    for (const pairId of pairIds) {
      const esCampeon = pairId === bracket.campeon_pair_id;
      let rondaEliminado: string | undefined;

      if (!esCampeon) {
        const derrota = partidos?.find(
          (m) =>
            m.estado === "finalizado" &&
            (m.pair_1_id === pairId || m.pair_2_id === pairId) &&
            (m.resultado_json as { ganador_id?: string })?.ganador_id !== pairId
        );
        rondaEliminado = derrota?.fase;
      }

      const clave = resultadoClave(bracket.tramo, esCampeon, rondaEliminado);
      const puntos = puntosPara(clave, categoria.nivel_orden);
      if (!puntos) continue;

      const { data: pair } = await admin
        .from("pairs")
        .select("player_1_id, player_2_id")
        .eq("id", pairId)
        .single();

      for (const playerId of [pair?.player_1_id, pair?.player_2_id]) {
        if (!playerId) continue;
        await admin.from("ranking_points").insert({
          player_id: playerId,
          tournament_id: torneoId,
          categoria_id: categoriaId,
          puntos_obtenidos: puntos,
          ronda_alcanzada: clave,
          fecha: torneo?.fecha_inicio ?? new Date().toISOString().slice(0, 10),
        });
        jugadoresAfectados.add(playerId);
      }
    }
  }

  for (const playerId of jugadoresAfectados) {
    await evaluarInsignias(admin, playerId);
  }
}