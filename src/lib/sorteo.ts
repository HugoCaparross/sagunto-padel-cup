// Ruta: src/lib/sorteo.ts — sustituye entero al archivo actual
export function generateGroups(
  pairs: { id: string; cabeza_de_serie: boolean }[]
): string[][] {
  const n = pairs.length;
  const numGroups = Math.max(1, Math.ceil(n / 4));
  const groups: string[][] = Array.from({ length: numGroups }, () => []);

  const cabezas = pairs.filter((p) => p.cabeza_de_serie);
  const resto = shuffle(pairs.filter((p) => !p.cabeza_de_serie));

  cabezas.forEach((p, i) => {
    groups[i % numGroups].push(p.id);
  });

  resto.forEach((p) => {
    const objetivo = groups.reduce(
      (min, g, idx) => (g.length < groups[min].length ? idx : min),
      0
    );
    groups[objetivo].push(p.id);
  });

  return groups;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Genera todos los cruces "todos contra todos" dentro de un grupo
export function roundRobin(pairIds: string[]): [string, string][] {
  const partidos: [string, string][] = [];
  for (let i = 0; i < pairIds.length; i++) {
    for (let j = i + 1; j < pairIds.length; j++) {
      partidos.push([pairIds[i], pairIds[j]]);
    }
  }
  return partidos;
}