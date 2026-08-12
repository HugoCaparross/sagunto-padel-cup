// Ruta: src/lib/badges.ts

import type { SupabaseClient } from "@supabase/supabase-js";

async function otorgar(
  admin: SupabaseClient,
  playerId: string,
  tipo: string,
) {
  const tipoNormalizado =
    tipo.trim();

  if (
    !playerId ||
    !tipoNormalizado
  ) {
    return;
  }

  const {
    data: existente,
    error: consultaError,
  } = await admin
    .from("badges")
    .select("id")
    .eq(
      "player_id",
      playerId,
    )
    .eq(
      "tipo",
      tipoNormalizado,
    )
    .maybeSingle();

  if (consultaError) {
    console.error(
      "[badges] Error comprobando insignia:",
      consultaError,
    );

    return;
  }

  if (existente) {
    return;
  }

  const { error: insertError } =
    await admin
      .from("badges")
      .insert({
        player_id: playerId,
        tipo: tipoNormalizado,
      });

  if (insertError) {
    if (
      insertError.code ===
      "23505"
    ) {
      return;
    }

    console.error(
      "[badges] Error creando insignia:",
      insertError,
    );

    return;
  }

  const {
    error: notificationError,
  } = await admin
    .from("notifications")
    .insert({
      player_id: playerId,
      tipo: "insignia",
      canal: "in_app",
      contenido: `Has desbloqueado la insignia "${tipoNormalizado.replace(
        /_/g,
        " ",
      )}"`,
    });

  if (notificationError) {
    console.error(
      "[badges] Error creando notificación de insignia:",
      notificationError,
    );
  }
}

export async function evaluarInsignias(
  admin: SupabaseClient,
  playerId: string,
) {
  if (!playerId) {
    return;
  }

  const {
    data: torneosJugados,
    error: torneosError,
  } = await admin
    .from("ranking_points")
    .select(
      "tournament_id",
    )
    .eq(
      "player_id",
      playerId,
    );

  if (torneosError) {
    console.error(
      "[badges] Error obteniendo torneos jugados:",
      torneosError,
    );

    return;
  }

  const numTorneos =
    new Set(
      (
        torneosJugados ??
        []
      )
        .map(
          (torneo) =>
            torneo.tournament_id,
        )
        .filter(
          (
            id,
          ): id is string =>
            typeof id ===
              "string" &&
            id.length > 0,
        ),
    ).size;

  if (numTorneos >= 1) {
    await otorgar(
      admin,
      playerId,
      "primer_torneo",
    );
  }

  const {
    data: pairs,
    error: pairsError,
  } = await admin
    .from("pairs")
    .select("id")
    .or(
      `player_1_id.eq.${playerId},player_2_id.eq.${playerId}`,
    );

  if (pairsError) {
    console.error(
      "[badges] Error obteniendo parejas:",
      pairsError,
    );

    return;
  }

  const pairIds =
    Array.from(
      new Set(
        (
          pairs ??
          []
        )
          .map(
            (pair) =>
              pair.id,
          )
          .filter(
            (
              id,
            ): id is string =>
              typeof id ===
                "string" &&
              id.length > 0,
          ),
      ),
    );

  if (pairIds.length > 0) {
    const {
      data: partidos,
      error: partidosError,
    } = await admin
      .from("matches")
      .select(
        "resultado_json",
      )
      .eq(
        "estado",
        "finalizado",
      )
      .or(
        `pair_1_id.in.(${pairIds.join(",")}),pair_2_id.in.(${pairIds.join(",")})`,
      );

    if (partidosError) {
      console.error(
        "[badges] Error obteniendo partidos:",
        partidosError,
      );
    } else {
      const jugados =
        partidos?.length ??
        0;

      const victorias =
        partidos?.filter(
          (partido) => {
            const resultado =
              partido.resultado_json as {
                ganador_id?: string;
              } | null;

            return pairIds.includes(
              resultado?.ganador_id ??
                "",
            );
          },
        ).length ?? 0;

      if (jugados >= 50) {
        await otorgar(
          admin,
          playerId,
          "50_partidos",
        );
      }

      if (victorias >= 10) {
        await otorgar(
          admin,
          playerId,
          "10_victorias",
        );
      }
    }
  }

  const {
    data: campeonatos,
    error: campeonatosError,
  } = await admin
    .from("ranking_points")
    .select(
      "ronda_alcanzada",
    )
    .eq(
      "player_id",
      playerId,
    )
    .like(
      "ronda_alcanzada",
      "campeon_%",
    );

  if (campeonatosError) {
    console.error(
      "[badges] Error comprobando títulos:",
      campeonatosError,
    );

    return;
  }

  if (
    (
      campeonatos ??
      []
    ).some(
      (item) =>
        item.ronda_alcanzada,
    )
  ) {
    await otorgar(
      admin,
      playerId,
      "campeon",
    );
  }
}