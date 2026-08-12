// Ruta: src/lib/points-table.ts
//
// Índice del array:
// 0 = 2ª
// 1 = 3ª
// 2 = 4ª
// 3 = Iniciación

export const TABLA_PUNTOS = {
  campeon_oro: [
    100,
    82,
    67,
    55,
  ],

  subcampeon_oro: [
    88,
    72,
    59,
    48,
  ],

  semifinalista_oro: [
    78,
    64,
    52,
    43,
  ],

  cuartofinalista_oro: [
    70,
    57,
    47,
    38,
  ],

  octavofinalista_oro: [
    64,
    52,
    43,
    35,
  ],

  campeon_plata: [
    62,
    51,
    42,
    34,
  ],

  subcampeon_plata: [
    54,
    44,
    36,
    30,
  ],

  semifinalista_plata: [
    48,
    39,
    32,
    26,
  ],

  cuartofinalista_plata: [
    44,
    36,
    29,
    24,
  ],

  campeon_bronce: [
    42,
    34,
    28,
    22,
  ],

  subcampeon_bronce: [
    36,
    30,
    24,
    19,
  ],

  semifinalista_bronce: [
    32,
    26,
    21,
    17,
  ],

  cuartofinalista_bronce: [
    28,
    23,
    19,
    15,
  ],

  participacion: [
    12,
    10,
    8,
    6,
  ],
} as const;

export type ResultadoRanking =
  keyof typeof TABLA_PUNTOS;

export function puntosPara(
  resultado: string,
  nivelOrden: number,
): number {
  if (
    !Number.isInteger(
      nivelOrden,
    ) ||
    nivelOrden < 1 ||
    nivelOrden > 4
  ) {
    return 0;
  }

  const fila =
    TABLA_PUNTOS[
      resultado as ResultadoRanking
    ];

  if (!fila) {
    return 0;
  }

  return (
    fila[
      nivelOrden - 1
    ] ?? 0
  );
}

const RONDA_A_ETIQUETA:
  Record<string, string> = {
  final: "subcampeon",
  semis: "semifinalista",
  cuartos: "cuartofinalista",
  octavos: "octavofinalista",
};

export function resultadoClave(
  tramo:
    | "oro"
    | "plata"
    | "bronce",
  esCampeon: boolean,
  rondaEliminado?: string,
): string {
  if (esCampeon) {
    return `campeon_${tramo}`;
  }

  const etiqueta =
    rondaEliminado
      ? RONDA_A_ETIQUETA[
          rondaEliminado
        ]
      : undefined;

  if (etiqueta) {
    return `${etiqueta}_${tramo}`;
  }

  return "participacion";
}