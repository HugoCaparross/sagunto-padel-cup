// Ruta: src/app/(admin)/admin/torneos/[id]/resultados/actions.ts — sustituye entero al archivo actual
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { resultadoSchema } from "@/lib/validations/resultado";
import { advanceWinner } from "@/lib/advance";
import { intentarCalcularRanking } from "@/lib/ranking";
import { revalidatePath } from "next/cache";

export async function guardarResultado(
  torneoId: string,
  matchId: string,
  formData: unknown
) {
  const admin_user = await requireAdmin();
  const parsed = resultadoSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Marcador no válido" };
  }
  const { sets } = parsed.data;

  const admin = createAdminClient();

  const { data: adminPlayer } = await admin
    .from("players")
    .select("id")
    .eq("auth_user_id", admin_user.id)
    .maybeSingle();

  const { data: match } = await admin
    .from("matches")
    .select("id, group_id, tramo, categoria_id, pair_1_id, pair_2_id, resultado_json, siguiente_match_id")
    .eq("id", matchId)
    .single();

  if (!match) return { ok: false, error: "Partido no encontrado" };

  let setsPair1 = 0;
  let setsPair2 = 0;
  let juegosPair1 = 0;
  let juegosPair2 = 0;

  for (const s of sets) {
    juegosPair1 += s.juegos_pair1;
    juegosPair2 += s.juegos_pair2;
    if (s.juegos_pair1 > s.juegos_pair2) setsPair1++;
    else if (s.juegos_pair2 > s.juegos_pair1) setsPair2++;
    else if (s.tiebreak && s.tiebreak_pair1 !== undefined && s.tiebreak_pair2 !== undefined) {
      if (s.tiebreak_pair1 > s.tiebreak_pair2) setsPair1++;
      else setsPair2++;
    }
  }

  const ganadorId = setsPair1 > setsPair2 ? match.pair_1_id : match.pair_2_id;

  await admin
    .from("matches")
    .update({
      estado: "finalizado",
      resultado_json: { sets, ganador_id: ganadorId },
      introducido_por: adminPlayer?.id ?? null,
      fecha_modificacion: new Date().toISOString(),
      hora_fin: new Date().toISOString(),
    })
    .eq("id", matchId);

  await admin.from("audit_log").insert({
    entidad: "matches",
    entidad_id: matchId,
    accion: "resultado_guardado",
    valores_anteriores_json: { resultado_json: match.resultado_json },
    valores_nuevos_json: { sets, ganador_id: ganadorId },
    fecha: new Date().toISOString(),
  });

  // Partido de fase de grupos: actualiza la clasificación
  if (match.group_id) {
    for (const pairId of [match.pair_1_id, match.pair_2_id]) {
      const esGanador = pairId === ganadorId;
      const propios = pairId === match.pair_1_id
        ? { sets: setsPair1, juegos: juegosPair1 }
        : { sets: setsPair2, juegos: juegosPair2 };
      const rivales = pairId === match.pair_1_id
        ? { sets: setsPair2, juegos: juegosPair2 }
        : { sets: setsPair1, juegos: juegosPair1 };

      const { data: standing } = await admin
        .from("group_standings")
        .select("*")
        .eq("group_id", match.group_id)
        .eq("pair_id", pairId)
        .single();

      if (standing) {
        await admin
          .from("group_standings")
          .update({
            partidos_jugados: standing.partidos_jugados + 1,
            victorias: standing.victorias + (esGanador ? 1 : 0),
            derrotas: standing.derrotas + (esGanador ? 0 : 1),
            sets_favor: standing.sets_favor + propios.sets,
            sets_contra: standing.sets_contra + rivales.sets,
            juegos_favor: standing.juegos_favor + propios.juegos,
            juegos_contra: standing.juegos_contra + rivales.juegos,
            puntos: standing.puntos + (esGanador ? 3 : 0),
          })
          .eq("id", standing.id);
      }
    }
  }

  // Partido de cuadro (Oro/Plata/Bronce): avanza al ganador y, si esta
  // era la última final pendiente de la categoría, reparte el ranking
  if (match.tramo && ganadorId) {
    await advanceWinner(admin, matchId, ganadorId);
    if (!match.siguiente_match_id) {
      await intentarCalcularRanking(admin, torneoId, match.categoria_id);
    }
  }

  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  revalidatePath(`/admin/torneos/${torneoId}/sorteo`);
  revalidatePath(`/admin/torneos/${torneoId}/cuadros`);
  return { ok: true };
}