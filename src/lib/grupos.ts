// Ruta: src/lib/grupos.ts
//
// Única fuente de verdad para el criterio de desempate:
// 1.º enfrentamiento directo
// 2.º diferencia de sets
// 3.º diferencia de juegos
//
// En empates de 3 o más parejas, el enfrentamiento directo
// se utiliza únicamente cuando puede resolver la comparación;
// si no, se continúa con la cascada de respaldo.

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
  partidos: PartidoResuelto[]
) {
  return partidos.find(
    (partido) =>
      (partido.pair_1_id === a &&
        partido.pair_2_id === b) ||
      (partido.pair_1_id === b &&
        partido.pair_2_id === a)
  );
}

function resultadoHeadToHead(
  a: string,
  b: string,
  partidos: PartidoResuelto[]
): number {
  const partido =
    obtenerEnfrentamiento(
      a,
      b,
      partidos
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

export function ordenarClasificacionGrupo(
  standings: Standing[],
  partidosDelGrupo: PartidoResuelto[]
): Standing[] {
  return [...standings].sort(
    (a, b) => {
      if (
        b.puntos !==
        a.puntos
      ) {
        return (
          b.puntos -
          a.puntos
        );
      }

      /*
       * El enfrentamiento directo es resolutivo
       * cuando el empate afecta a dos parejas.
       *
       * En empates múltiples no forzamos una
       * comparación parcial que pueda generar un
       * orden incoherente; continuamos con la
       * diferencia de sets.
       */
      const empatados =
        standings.filter(
          (standing) =>
            standing.puntos ===
            a.puntos
        );

      if (
        empatados.length === 2
      ) {
        const h2h =
          resultadoHeadToHead(
            a.pair_id,
            b.pair_id,
            partidosDelGrupo
          );

        if (h2h !== 0) {
          return h2h;
        }
      }

      const diffSetsA =
        a.sets_favor -
        a.sets_contra;

      const diffSetsB =
        b.sets_favor -
        b.sets_contra;

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
        a.juegos_favor -
        a.juegos_contra;

      const diffJuegosB =
        b.juegos_favor -
        b.juegos_contra;

      if (
        diffJuegosB !==
        diffJuegosA
      ) {
        return (
          diffJuegosB -
          diffJuegosA
        );
      }

      /*
       * Si todas las métricas son iguales,
       * conservamos el orden original.
       */
      return 0;
    }
  );
}