// Ruta: src/lib/grupos.ts
// Única fuente de verdad para el criterio de desempate de grupos:
// 1º puntos, 2º enfrentamiento directo (solo empates a 2), 3º diferencia
// de sets, 4º diferencia de juegos. Se usa tanto para generar la fase
// final como para mostrar la clasificación pública — así nunca pueden
// desincronizarse.

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
  resultado_json: { ganador_id?: string } | null;
};

export function ordenarClasificacionGrupo(
  standings: Standing[],
  partidosDelGrupo: PartidoResuelto[]
): Standing[] {
  function headToHead(a: string, b: string): number {
    const partido = partidosDelGrupo.find(
      (m) =>
        (m.pair_1_id === a && m.pair_2_id === b) ||
        (m.pair_1_id === b && m.pair_2_id === a)
    );
    if (!partido) return 0;
    const ganador = partido.resultado_json?.ganador_id;
    if (ganador === a) return -1;
    if (ganador === b) return 1;
    return 0;
  }

  return [...standings].sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;

    const empatados = standings.filter((s) => s.puntos === a.puntos);
    if (empatados.length === 2) {
      const h2h = headToHead(a.pair_id, b.pair_id);
      if (h2h !== 0) return h2h;
    }

    const diffSetsA = a.sets_favor - a.sets_contra;
    const diffSetsB = b.sets_favor - b.sets_contra;
    if (diffSetsB !== diffSetsA) return diffSetsB - diffSetsA;

    const diffJuegosA = a.juegos_favor - a.juegos_contra;
    const diffJuegosB = b.juegos_favor - b.juegos_contra;
    return diffJuegosB - diffJuegosA;
  });
}