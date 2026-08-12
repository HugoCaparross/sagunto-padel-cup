// Ruta: src/lib/bracket.ts

export function nextPow2(
  n: number,
): number {
  if (
    !Number.isFinite(n) ||
    n <= 0
  ) {
    return 1;
  }

  let p = 1;

  while (p < n) {
    p *= 2;
  }

  return p;
}

export const FASE_POR_NUM_PARTIDOS:
  Record<number, string> = {
    8: "octavos",
    4: "cuartos",
    2: "semis",
    1: "final",
  };

export type FirstRound = {
  fase: string;
  byes: string[];
  enfrentamientos: [
    string,
    string,
  ][];
};

// pairsSeeded: parejas ya ordenadas de mejor a peor seed.
// Los mejores seeds reciben bye si sobran huecos.
export function buildFirstRound(
  pairsSeeded: string[],
): FirstRound {
  const parejas =
    Array.from(
      new Set(
        pairsSeeded.filter(
          (
            id,
          ): id is string =>
            typeof id ===
              "string" &&
            id.trim().length >
              0,
        ),
      ),
    );

  if (parejas.length <= 1) {
    return {
      fase: "final",
      byes: parejas,
      enfrentamientos: [],
    };
  }

  const total =
    nextPow2(
      parejas.length,
    );

  const numByes =
    total - parejas.length;

  const byes =
    parejas.slice(
      0,
      numByes,
    );

  const resto =
    parejas.slice(
      numByes,
    );

  const enfrentamientos:
    [
      string,
      string,
    ][] = [];

  for (
    let i = 0;
    i < resto.length / 2;
    i += 1
  ) {
    const izquierda =
      resto[i];

    const derecha =
      resto[
        resto.length -
          1 -
          i
      ];

    if (
      !izquierda ||
      !derecha ||
      izquierda ===
        derecha
    ) {
      continue;
    }

    enfrentamientos.push([
      izquierda,
      derecha,
    ]);
  }

  const fase =
    FASE_POR_NUM_PARTIDOS[
      enfrentamientos.length
    ] ??
    "octavos";

  return {
    fase,
    byes,
    enfrentamientos,
  };
}