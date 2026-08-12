// Ruta: src/lib/gamification.ts

import type { SupabaseClient } from "@supabase/supabase-js";

const UMBRALES = [
  0,
  50,
  120,
  220,
  350,
  520,
  730,
  990,
  1300,
  1670,
  2100,
  2600,
  3180,
  3850,
  4620,
  5500,
  6500,
  7630,
  8900,
  10320,
] as const;

const INCREMENTO_DIAMANTE_PLUS =
  1500;

const TRAMOS = [
  {
    nombre: "Bronce",
    desde: 1,
    hasta: 5,
  },
  {
    nombre: "Plata",
    desde: 6,
    hasta: 10,
  },
  {
    nombre: "Oro",
    desde: 11,
    hasta: 15,
  },
  {
    nombre: "Diamante",
    desde: 16,
    hasta: 20,
  },
] as const;

function numeroSeguro(
  value: number,
  minimo = 0,
): number {
  if (
    !Number.isFinite(value)
  ) {
    return minimo;
  }

  return Math.max(
    minimo,
    value,
  );
}

export function calcularXP(
  puntosRankingMovil: number,
  torneosJugadosHistorico: number,
  porcentajeVictorias: number,
): number {
  const puntos =
    numeroSeguro(
      puntosRankingMovil,
    );

  const torneos =
    Math.floor(
      numeroSeguro(
        torneosJugadosHistorico,
      ),
    );

  const porcentaje =
    Math.min(
      100,
      numeroSeguro(
        porcentajeVictorias,
      ),
    );

  const base =
    puntos +
    torneos * 20;

  const multiplicador =
    1 +
    porcentaje / 200;

  return Math.max(
    0,
    Math.round(
      base * multiplicador,
    ),
  );
}

export function nivelDesdeXP(
  xp: number,
) {
  const xpSeguro =
    Math.max(
      0,
      Math.floor(
        numeroSeguro(xp),
      ),
    );

  const ultimoUmbral =
    UMBRALES[
      UMBRALES.length - 1
    ];

  if (
    xpSeguro >=
    ultimoUmbral
  ) {
    const nivelesExtra =
      Math.floor(
        (xpSeguro -
          ultimoUmbral) /
          INCREMENTO_DIAMANTE_PLUS,
      );

    const nivel =
      20 +
      nivelesExtra;

    const etiqueta =
      nivelesExtra === 0
        ? "Diamante 5"
        : `Diamante +${nivelesExtra}`;

    const siguienteUmbral =
      ultimoUmbral +
      (nivelesExtra + 1) *
        INCREMENTO_DIAMANTE_PLUS;

    return {
      nivel,
      etiqueta,
      xp: xpSeguro,
      siguienteUmbral,
    };
  }

  let nivel = 1;

  for (
    let i =
      UMBRALES.length - 1;
    i >= 0;
    i -= 1
  ) {
    if (
      xpSeguro >=
      UMBRALES[i]
    ) {
      nivel = i + 1;
      break;
    }
  }

  const tramo =
    TRAMOS.find(
      (item) =>
        nivel >=
          item.desde &&
        nivel <=
          item.hasta,
    );

  if (!tramo) {
    return {
      nivel: 1,
      etiqueta: "Bronce 1",
      xp: xpSeguro,
      siguienteUmbral:
        UMBRALES[1] ?? 50,
    };
  }

  const subnivel =
    nivel -
    tramo.desde +
    1;

  const etiqueta =
    `${tramo.nombre} ${subnivel}`;

  const siguienteUmbral =
    UMBRALES[nivel] ??
    ultimoUmbral +
      INCREMENTO_DIAMANTE_PLUS;

  return {
    nivel,
    etiqueta,
    xp: xpSeguro,
    siguienteUmbral,
  };
}

export async function obtenerNivelJugador(
  supabase: SupabaseClient,
  playerId: string,
) {
  if (!playerId) {
    return nivelDesdeXP(0);
  }

  const hoy =
    new Date()
      .toISOString()
      .slice(0, 10);

  const {
    data: puntosVivos,
    error: puntosVivosError,
  } = await supabase
    .from("ranking_points")
    .select(
      "puntos_obtenidos, tournament_id",
    )
    .eq(
      "player_id",
      playerId,
    )
    .gte(
      "fecha_caducidad",
      hoy,
    );

  if (puntosVivosError) {
    console.error(
      "[gamification] Error obteniendo ranking móvil:",
      puntosVivosError,
    );
  }

  const {
    data: puntosHistoricos,
    error: puntosHistoricosError,
  } = await supabase
    .from("ranking_points")
    .select(
      "tournament_id",
    )
    .eq(
      "player_id",
      playerId,
    );

  if (
    puntosHistoricosError
  ) {
    console.error(
      "[gamification] Error obteniendo historial de ranking:",
      puntosHistoricosError,
    );
  }

  const puntosRankingMovil =
    puntosVivos?.reduce(
      (
        suma,
        punto,
      ) =>
        suma +
        numeroSeguro(
          punto.puntos_obtenidos,
        ),
      0,
    ) ?? 0;

  const torneosJugados =
    new Set(
      (
        puntosHistoricos ??
        []
      )
        .map(
          (punto) =>
            punto.tournament_id,
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

  const {
    data: pairs,
    error: pairsError,
  } = await supabase
    .from("pairs")
    .select("id")
    .or(
      `player_1_id.eq.${playerId},player_2_id.eq.${playerId}`,
    );

  if (pairsError) {
    console.error(
      "[gamification] Error obteniendo parejas:",
      pairsError,
    );
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

  let victorias = 0;
  let jugados = 0;

  if (
    pairIds.length > 0
  ) {
    const {
      data: partidos,
      error: partidosError,
    } = await supabase
      .from("matches")
      .select(
        "id, resultado_json",
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
        "[gamification] Error obteniendo partidos:",
        partidosError,
      );
    } else {
      const partidosUnicos =
        Array.from(
          new Map(
            (
              partidos ??
              []
            )
              .filter(
                (
                  partido,
                ): partido is typeof partido & {
                  id: string;
                } =>
                  typeof partido.id ===
                  "string",
              )
              .map(
                (
                  partido,
                ) => [
                  partido.id,
                  partido,
                ],
              ),
          ).values(),
        );

      jugados =
        partidosUnicos.length;

      victorias =
        partidosUnicos.filter(
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
        ).length;
    }
  }

  const porcentajeVictorias =
    jugados >= 3
      ? Math.round(
          (victorias /
            jugados) *
            100,
        )
      : 0;

  const xp =
    calcularXP(
      puntosRankingMovil,
      torneosJugados,
      porcentajeVictorias,
    );

  return nivelDesdeXP(
    xp,
  );
}