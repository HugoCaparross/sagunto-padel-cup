// Ruta: src/lib/badges.ts
import { SupabaseClient } from "@supabase/supabase-js";

async function otorgar(admin: SupabaseClient, playerId: string, tipo: string) {
  const { data: existente } = await admin
    .from("badges")
    .select("id")
    .eq("player_id", playerId)
    .eq("tipo", tipo)
    .maybeSingle();
  if (existente) return;

  await admin.from("badges").insert({ player_id: playerId, tipo });
  await admin.from("notifications").insert({
    player_id: playerId,
    tipo: "insignia",
    canal: "in_app",
    contenido: `Has desbloqueado la insignia "${tipo.replace(/_/g, " ")}"`,
  });
}

// Revisa las insignias basadas en actividad (partidos/victorias/torneos)
// y otorga las que falten. Se llama tras cerrar un torneo.
export async function evaluarInsignias(admin: SupabaseClient, playerId: string) {
  const { data: torneosJugados } = await admin
    .from("ranking_points")
    .select("tournament_id")
    .eq("player_id", playerId);
  const numTorneos = new Set(torneosJugados?.map((t) => t.tournament_id)).size;

  if (numTorneos >= 1) await otorgar(admin, playerId, "primer_torneo");

  const { data: pairs } = await admin
    .from("pairs")
    .select("id")
    .or(`player_1_id.eq.${playerId},player_2_id.eq.${playerId}`);
  const pairIds = pairs?.map((p) => p.id) ?? [];

  if (pairIds.length) {
    const { data: partidos } = await admin
      .from("matches")
      .select("resultado_json")
      .eq("estado", "finalizado")
      .or(`pair_1_id.in.(${pairIds.join(",")}),pair_2_id.in.(${pairIds.join(",")})`);

    const jugados = partidos?.length ?? 0;
    const victorias =
      partidos?.filter((p) =>
        pairIds.includes((p.resultado_json as { ganador_id?: string })?.ganador_id ?? "")
      ).length ?? 0;

    if (jugados >= 50) await otorgar(admin, playerId, "50_partidos");
    if (victorias >= 10) await otorgar(admin, playerId, "10_victorias");
  }

  const { data: campeonatos } = await admin
    .from("ranking_points")
    .select("ronda_alcanzada")
    .eq("player_id", playerId)
    .like("ronda_alcanzada", "campeon_%");
  if (campeonatos?.length) await otorgar(admin, playerId, "campeon");
}