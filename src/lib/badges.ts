// Ruta: src/lib/badges.ts

import type { SupabaseClient } from "@supabase/supabase-js";

async function otorgar(
  admin: SupabaseClient,
  playerId: string,
  tipo: string
) {
  const {
    data: existente,
    error: consultaError,
  } = await admin
    .from("badges")
    .select("id")
    .eq("player_id", playerId)
    .eq("tipo", tipo)
    .maybeSingle();

  if (consultaError) {
    console.error(
      "[badges] Error comprobando insignia:",
      consultaError
    );
    return;
  }

  if (existente) {
    return;
  }

  const { error: insertError } =
    await admin.from("badges").insert({
      player_id: playerId,
      tipo,
    });

  if (insertError) {
    /*
     * Si existe una restricción única y otro proceso ha
     * creado la insignia entre la comprobación y el insert,
     * no debemos generar una segunda notificación.
     */
    if (insertError.code === "23505") {
      return;
    }

    console.error(
      "[badges] Error creando insignia:",
      insertError
    );

    return;
  }

  const { error: notificationError } =
    await admin
      .from("notifications")
      .insert({
        player_id: playerId,
        tipo: "insignia",
        canal: "in_app",
        contenido: `Has desbloqueado la insignia "${tipo.replace(
          /_/g,
          " "
        )}"`,
      });

  if (notificationError) {
    console.error(
      "[badges] Error creando notificación de insignia:",
      notificationError
    );
  }
}

// Revisa las insignias basadas en actividad
// (torneos, partidos, victorias y títulos)
// y otorga las que falten.
// Se llama tras cerrar un torneo.
export async function evaluarInsignias(
  admin: SupabaseClient,
  playerId: string
) {
  const {
    data: torneosJugados,
    error: torneosError,
  } = await admin
    .from("ranking_points")
    .select("tournament_id")
    .eq("player_id", playerId);

  if (torneosError) {
    console.error(
      "[badges] Error obteniendo torneos jugados:",
      torneosError
    );
    return;
  }

  const numTorneos = new Set(
    torneosJugados?.map(
      (t) => t.tournament_id
    )
  ).size;

  if (numTorneos >= 1) {
    await otorgar(
      admin,
      playerId,
      "primer_torneo"
    );
  }

  const {
    data: pairs,
    error: pairsError,
  } = await admin
    .from("pairs")
    .select("id")
    .or(
      `player_1_id.eq.${playerId},player_2_id.eq.${playerId}`
    );

  if (pairsError) {
    console.error(
      "[badges] Error obteniendo parejas:",
      pairsError
    );
    return;
  }

  const pairIds =
    pairs?.map((p) => p.id) ?? [];

  if (pairIds.length > 0) {
    const {
      data: partidos,
      error: partidosError,
    } = await admin
      .from("matches")
      .select("resultado_json")
      .eq("estado", "finalizado")
      .or(
        `pair_1_id.in.(${pairIds.join(
          ","
        )}),pair_2_id.in.(${pairIds.join(
          ","
        )})`
      );

    if (partidosError) {
      console.error(
        "[badges] Error obteniendo partidos:",
        partidosError
      );
    } else {
      const jugados =
        partidos?.length ?? 0;

      const victorias =
        partidos?.filter((p) => {
          const resultado =
            p.resultado_json as {
              ganador_id?: string;
            } | null;

          return pairIds.includes(
            resultado?.ganador_id ?? ""
          );
        }).length ?? 0;

      if (jugados >= 50) {
        await otorgar(
          admin,
          playerId,
          "50_partidos"
        );
      }

      if (victorias >= 10) {
        await otorgar(
          admin,
          playerId,
          "10_victorias"
        );
      }
    }
  }

  const {
    data: campeonatos,
    error: campeonatosError,
  } = await admin
    .from("ranking_points")
    .select("ronda_alcanzada")
    .eq("player_id", playerId)
    .like(
      "ronda_alcanzada",
      "campeon_%"
    );

  if (campeonatosError) {
    console.error(
      "[badges] Error comprobando títulos:",
      campeonatosError
    );
    return;
  }

  if (campeonatos?.length) {
    await otorgar(
      admin,
      playerId,
      "campeon"
    );
  }
}