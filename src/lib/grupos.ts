// Ruta: src/lib/grupos.ts
//
// Criterio de desempate:
// 1.º enfrentamiento directo cuando resuelve un empate de dos parejas
// 2.º diferencia de sets
// 3.º diferencia de juegos
// 4.º orden original como último desempate estable

export type Standing = {
  pair_id: string;
  puntos: number;
  sets_favor: number;
  sets_contra: number;
  juegos_favor: number;
  juegos_contra: number;
};

export type PartidoResuelto = {
  pair_1_id: string | null;
  pair_2_id: string | null;
  resultado_json: {
    ganador_id?: string;
  } | null;
};

function obtenerEnfrentamiento(
  a: string,
  b: string,
  partidos: PartidoResuelto[],
) {
  return partidos.find(
    (partido) =>
      (partido.pair_1_id === a &&
        partido.pair_2_id === b) ||
      (partido.pair_1_id === b &&
        partido.pair_2_id === a),
  );
}

function resultadoHeadToHead(
  a: string,
  b: string,
  partidos: PartidoResuelto[],
): number {
  const partido =
    obtenerEnfrentamiento(
      a,
      b,
      partidos,
    );

  if (!partido) {
    return 0;
  }

  const ganador =
    partido.resultado_json
      ?.ganador_id;

  if (ganador === a) {
    return -1;
  }

  if (ganador === b) {
    return 1;
  }

  return 0;
}

function diferenciaSets(
  standing: Standing,
): number {
  return (
    standing.sets_favor -
    standing.sets_contra
  );
}

function diferenciaJuegos(
  standing: Standing,
): number {
  return (
    standing.juegos_favor -
    standing.juegos_contra
  );
}

export function ordenarClasificacionGrupo(
  standings: Standing[],
  partidosDelGrupo: PartidoResuelto[],
): Standing[] {
  const ordenOriginal =
    new Map(
      standings.map(
        (
          standing,
          index,
        ) => [
          standing.pair_id,
          index,
        ],
      ),
    );

  return [
    ...standings,
  ].sort((a, b) => {
    if (
      b.puntos !==
      a.puntos
    ) {
      return (
        b.puntos -
        a.puntos
      );
    }

    const empatados =
      standings.filter(
        (standing) =>
          standing.puntos ===
          a.puntos,
      );

    if (
      empatados.length ===
      2
    ) {
      const h2h =
        resultadoHeadToHead(
          a.pair_id,
          b.pair_id,
          partidosDelGrupo,
        );

      if (h2h !== 0) {
        return h2h;
      }
    }

    const diffSetsA =
      diferenciaSets(a);

    const diffSetsB =
      diferenciaSets(b);

    if (
      diffSetsB !==
      diffSetsA
    ) {
      return (
        diffSetsB -
        diffSetsA
      );
    }

    const diffJuegosA =
      diferenciaJuegos(a);

    const diffJuegosB =
      diferenciaJuegos(b);

    if (
      diffJuegosB !==
      diffJuegosA
    ) {
      return (
        diffJuegosB -
        diffJuegosA
      );
    }

    return (
      (
        ordenOriginal.get(
          a.pair_id,
        ) ?? 0
      ) -
      (
        ordenOriginal.get(
          b.pair_id,
        ) ?? 0
      )
    );
  });
}