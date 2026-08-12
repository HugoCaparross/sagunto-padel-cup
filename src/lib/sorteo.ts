// Ruta: src/lib/sorteo.ts

export type SorteoPareja = {
  id: string;
  cabeza_de_serie: boolean;
};

function randomUint32(): number {
  const valores =
    new Uint32Array(1);

  globalThis.crypto.getRandomValues(
    valores,
  );

  return (
    valores[0] ?? 0
  );
}

function shuffle<T>(
  arr: T[],
): T[] {
  const resultado = [
    ...arr,
  ];

  for (
    let i =
      resultado.length - 1;
    i > 0;
    i -= 1
  ) {
    const j =
      randomUint32() %
      (i + 1);

    [
      resultado[i],
      resultado[j],
    ] = [
      resultado[j],
      resultado[i],
    ];
  }

  return resultado;
}

export function generateGroups(
  pairs: SorteoPareja[],
): string[][] {
  const parejasValidas =
    Array.from(
      new Map(
        pairs
          .filter(
            (
              pair,
            ): pair is SorteoPareja =>
              Boolean(
                pair &&
                  typeof pair.id ===
                    "string" &&
                  pair.id
                    .trim()
                    .length > 0,
              ),
          )
          .map(
            (pair) => [
              pair.id,
              pair,
            ],
          ),
      ).values(),
    );

  const n =
    parejasValidas.length;

  if (n === 0) {
    return [];
  }

  const numGroups =
    Math.max(
      1,
      Math.ceil(n / 4),
    );

  const groups:
    string[][] =
    Array.from(
      {
        length:
          numGroups,
      },
      () => [],
    );

  const cabezas =
    shuffle(
      parejasValidas.filter(
        (pair) =>
          pair.cabeza_de_serie,
      ),
    );

  const resto =
    shuffle(
      parejasValidas.filter(
        (pair) =>
          !pair.cabeza_de_serie,
      ),
    );

  cabezas.forEach(
    (
      pair,
      index,
    ) => {
      groups[
        index % numGroups
      ].push(pair.id);
    },
  );

  resto.forEach(
    (pair) => {
      let objetivo = 0;

      for (
        let index = 1;
        index <
          groups.length;
        index += 1
      ) {
        if (
          groups[index]
            .length <
          groups[
            objetivo
          ].length
        ) {
          objetivo =
            index;
        }
      }

      groups[
        objetivo
      ].push(pair.id);
    },
  );

  return groups;
}

export function roundRobin(
  pairIds: string[],
): [
  string,
  string,
][] {
  const ids =
    Array.from(
      new Set(
        pairIds.filter(
          (
            id,
          ): id is string =>
            typeof id ===
              "string" &&
            id.trim()
              .length > 0,
        ),
      ),
    );

  const partidos:
    [
      string,
      string,
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
      const pair1 =
        ids[i];

      const pair2 =
        ids[j];

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