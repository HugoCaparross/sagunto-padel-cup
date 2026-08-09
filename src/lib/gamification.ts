// Ruta: src/lib/gamification.ts
import { SupabaseClient } from "@supabase/supabase-js";

// XP acumulado necesario para alcanzar cada nivel (índice 0 = nivel 1)
const UMBRALES = [
  0, 50, 120, 220, 350, 520, 730, 990, 1300, 1670, 2100, 2600, 3180, 3850,
  4620, 5500, 6500, 7630, 8900, 10320,
];
const INCREMENTO_DIAMANTE_PLUS = 1500;

const TRAMOS = [
  { nombre: "Bronce", desde: 1, hasta: 5 },
  { nombre: "Plata", desde: 6, hasta: 10 },
  { nombre: "Oro", desde: 11, hasta: 15 },
  { nombre: "Diamante", desde: 16, hasta: 20 },
];

export function calcularXP(
  puntosRankingMovil: number,
  torneosJugadosHistorico: number,
  porcentajeVictorias: number
): number {
  const base = puntosRankingMovil + torneosJugadosHistorico * 20;
  const multiplicador = 1 + porcentajeVictorias / 200;
  return Math.round(base * multiplicador);
}

export function nivelDesdeXP(xp: number) {
  let nivel = 1;
  for (let i = UMBRALES.length - 1; i >= 0; i--) {
    if (xp >= UMBRALES[i]) {
      nivel = i + 1;
      break;
    }
  }

  let etiqueta: string;
  if (nivel <= 20) {
    const tramo = TRAMOS.find((t) => nivel >= t.desde && nivel <= t.hasta)!;
    const subnivel = nivel - tramo.desde + 1;
    etiqueta = `${tramo.nombre} ${subnivel}`;
  } else {
    const extra = Math.floor((xp - UMBRALES[19]) / INCREMENTO_DIAMANTE_PLUS);
    etiqueta = `Diamante +${extra}`;
  }

  const siguienteUmbral = UMBRALES[nivel] ?? UMBRALES[19] + INCREMENTO_DIAMANTE_PLUS * (nivel - 19);

  return { nivel, etiqueta, xp, siguienteUmbral };
}

// Calcula el XP y nivel de un jugador a partir de sus datos en Supabase
export async function obtenerNivelJugador(supabase: SupabaseClient, playerId: string) {
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: puntosVivos } = await supabase
    .from("ranking_points")
    .select("puntos_obtenidos, tournament_id")
    .eq("player_id", playerId)
    .gte("fecha_caducidad", hoy);

  const { data: puntosHistoricos } = await supabase
    .from("ranking_points")
    .select("tournament_id")
    .eq("player_id", playerId);

  const puntosRankingMovil = puntosVivos?.reduce((s, p) => s + p.puntos_obtenidos, 0) ?? 0;
  const torneosJugados = new Set(puntosHistoricos?.map((p) => p.tournament_id)).size;

  const { data: pairs } = await supabase
    .from("pairs")
    .select("id")
    .or(`player_1_id.eq.${playerId},player_2_id.eq.${playerId}`);
  const pairIds = pairs?.map((p) => p.id) ?? [];

  let victorias = 0;
  let jugados = 0;
  if (pairIds.length) {
    const { data: partidos } = await supabase
      .from("matches")
      .select("resultado_json, pair_1_id, pair_2_id")
      .eq("estado", "finalizado")
      .or(
        `pair_1_id.in.(${pairIds.join(",")}),pair_2_id.in.(${pairIds.join(",")})`
      );

    jugados = partidos?.length ?? 0;
    victorias =
      partidos?.filter((p) =>
        pairIds.includes((p.resultado_json as { ganador_id?: string })?.ganador_id ?? "")
      ).length ?? 0;
  }

  const porcentajeVictorias = jugados >= 3 ? Math.round((victorias / jugados) * 100) : 0;

  const xp = calcularXP(puntosRankingMovil, torneosJugados, porcentajeVictorias);
  return nivelDesdeXP(xp);
}