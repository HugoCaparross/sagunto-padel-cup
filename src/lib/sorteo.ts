// Ruta: src/lib/sorteo.ts

export type SorteoPareja = {
  id: string;
  cabeza_de_serie: boolean;
};

export function generateGroups(
  pairs: SorteoPareja[]
): string[][] {
  const parejasValidas =
    pairs.filter(
      (pair): pair is SorteoPareja =>
        Boolean(
          pair &&
            typeof pair.id ===
              "string" &&
            pair.id.length > 0
        )
    );

  const n =
    parejasValidas.length;

  if (n === 0) {
    return [];
  }

  /*
   * Se mantienen aproximadamente 4 parejas
   * por grupo.
   *
   * Ejemplos:
   *  1-4  -> 1 grupo
   *  5-8  -> 2 grupos
   *  9-12 -> 3 grupos
   */
  const numGroups = Math.max(
    1,
    Math.ceil(n / 4)
  );

  const groups: string[][] =
    Array.from(
      {
        length: numGroups,
      },
      () => []
    );

  const cabezas =
    parejasValidas.filter(
      (pair) =>
        pair.cabeza_de_serie
    );

  const resto = shuffle(
    parejasValidas.filter(
      (pair) =>
        !pair.cabeza_de_serie
    )
  );

  /*
   * Las cabezas de serie se distribuyen
   * una por grupo antes de repartir el resto.
   *
   * Si hay más cabezas de serie que grupos,
   * el reparto circular mantiene la distribución.
   */
  cabezas.forEach(
    (pair, index) => {
      const groupIndex =
        index % numGroups;

      groups[groupIndex].push(
        pair.id
      );
    }
  );

  /*
   * El resto se asigna siempre al grupo
   * actualmente más pequeño.
   *
   * En caso de empate, reduce conserva el
   * primer grupo disponible, evitando introducir
   * un segundo factor aleatorio innecesario.
   */
  resto.forEach((pair) => {
    let objetivo = 0;

    for (
      let index = 1;
      index < groups.length;
      index += 1
    ) {
      if (
        groups[index].length <
        groups[objetivo].length
      ) {
        objetivo = index;
      }
    }

    groups[objetivo].push(
      pair.id
    );
  });

  return groups;
}

function shuffle<T>(
  arr: T[]
): T[] {
  const a = [...arr];

  for (
    let i = a.length - 1;
    i > 0;
    i -= 1
  ) {
    const j = Math.floor(
      Math.random() *
        (i + 1)
    );

    [a[i], a[j]] = [
      a[j],
      a[i],
    ];
  }

  return a;
}

// Genera todos los cruces "todos contra todos"
// dentro de un grupo.
export function roundRobin(
  pairIds: string[]
): [string, string][] {
  const ids = pairIds.filter(
    (
      id
    ): id is string =>
      typeof id === "string" &&
      id.length > 0
  );

  const partidos: [
    string,
    string
  ][] = [];

  for (
    let i = 0;
    i < ids.length;
    i += 1
  ) {
    for (
      let j = i + 1;
      j < ids.length;
      j += 1
    ) {
      const pair1 = ids[i];
      const pair2 = ids[j];

      if (
        !pair1 ||
        !pair2
      ) {
        continue;
      }

      partidos.push([
        pair1,
        pair2,
      ]);
    }
  }

  return partidos;
}