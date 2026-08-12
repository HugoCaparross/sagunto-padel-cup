// Ruta: src/lib/bracket.ts

export function nextPow2(n: number): number {
  if (!Number.isFinite(n) || n <= 0) {
    return 1;
  }

  let p = 1;

  while (p < n) {
    p *= 2;
  }

  return p;
}

export const FASE_POR_NUM_PARTIDOS: Record<number, string> = {
  8: "octavos",
  4: "cuartos",
  2: "semis",
  1: "final",
};

export type FirstRound = {
  fase: string;
  byes: string[];
  enfrentamientos: [string, string][];
};

// pairsSeeded debe llegar ordenado de mejor a peor seed.
// Los mejores seeds reciben los byes cuando el cuadro no es potencia de 2.
export function buildFirstRound(pairsSeeded: string[]): FirstRound {
  const parejas = Array.from(
    new Set(
      pairsSeeded.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0,
      ),
    ),
  );

  if (parejas.length === 0) {
    return {
      fase: "final",
      byes: [],
      enfrentamientos: [],
    };
  }

  if (parejas.length === 1) {
    return {
      fase: "final",
      byes: [parejas[0]],
      enfrentamientos: [],
    };
  }

  const total = nextPow2(parejas.length);

  const numByes = total - parejas.length;

  const byes = parejas.slice(0, numByes);

  const resto = parejas.slice(numByes);

  const enfrentamientos: [string, string][] = [];

  for (let i = 0; i < resto.length / 2; i += 1) {
    const izquierda = resto[i];
    const derecha = resto[resto.length - 1 - i];

    if (!izquierda || !derecha || izquierda === derecha) {
      continue;
    }

    enfrentamientos.push([izquierda, derecha]);
  }

  /*
   * La fase inicial depende del tamaño completo
   * del cuadro, no del número de enfrentamientos
   * efectivos.
   *
   * Ejemplo:
   * - 3 parejas -> cuadro de 4 -> semifinales.
   * - 5 parejas -> cuadro de 8 -> octavos.
   *
   * Si usamos enfrentamientos.length, los byes
   * provocan una fase incorrecta.
   */
  const numPartidosPrimeraRonda = total / 2;

  const fase = FASE_POR_NUM_PARTIDOS[numPartidosPrimeraRonda] ?? "octavos";

  return {
    fase,
    byes,
    enfrentamientos,
  };
}
