// Ruta: src/lib/bracket.ts — sustituye entero al archivo actual
export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export const FASE_POR_NUM_PARTIDOS: Record<number, string> = {
  8: "octavos",
  4: "cuartos",
  2: "semis",
  1: "final",
};

// pairsSeeded: parejas ya ordenadas de mejor a peor seed.
// Los mejores seeds (los primeros) reciben bye si sobran huecos.
export function buildFirstRound(pairsSeeded: string[]) {
  const total = nextPow2(pairsSeeded.length);
  const numByes = total - pairsSeeded.length;

  const byes = pairsSeeded.slice(0, numByes);
  const resto = pairsSeeded.slice(numByes);

  const enfrentamientos: [string, string][] = [];
  for (let i = 0; i < resto.length / 2; i++) {
    enfrentamientos.push([resto[i], resto[resto.length - 1 - i]]);
  }

  return { fase: FASE_POR_NUM_PARTIDOS[resto.length] ?? "octavos", byes, enfrentamientos };
}