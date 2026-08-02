// Ruta: src/app/(admin)/admin/torneos/[id]/cuadros/actions.ts — sustituye entero al archivo actual
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextPow2, FASE_POR_NUM_PARTIDOS } from "@/lib/bracket";
import { advanceWinner } from "@/lib/advance";
import { revalidatePath } from "next/cache";

type Standing = {
  pair_id: string;
  puntos: number;
  sets_favor: number;
  sets_contra: number;
  juegos_favor: number;
  juegos_contra: number;
};

function ordenarGrupo(
  standings: Standing[],
  headToHead: (a: string, b: string) => number
) {
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

export async function generarFaseFinal(torneoId: string, categoriaId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: grupos } = await admin
    .from("groups")
    .select("id")
    .eq("tournament_id", torneoId)
    .eq("categoria_id", categoriaId);

  if (!grupos?.length) {
    return { ok: false, error: "No hay grupos generados para esta categoría" };
  }

  const tramosAsignados: {
    pairId: string;
    tramo: "oro" | "plata" | "bronce";
    posicionGlobal: number;
  }[] = [];

  for (const grupo of grupos) {
    const { data: standings } = await admin
      .from("group_standings")
      .select("pair_id, puntos, sets_favor, sets_contra, juegos_favor, juegos_contra")
      .eq("group_id", grupo.id);

    if (!standings?.length) continue;

    const { data: partidosGrupo } = await admin
      .from("matches")
      .select("pair_1_id, pair_2_id, resultado_json")
      .eq("group_id", grupo.id)
      .eq("estado", "finalizado");

    const headToHead = (a: string, b: string) => {
      const partido = partidosGrupo?.find(
        (m) =>
          (m.pair_1_id === a && m.pair_2_id === b) ||
          (m.pair_1_id === b && m.pair_2_id === a)
      );
      if (!partido) return 0;
      const ganador = (partido.resultado_json as { ganador_id?: string })?.ganador_id;
      if (ganador === a) return -1;
      if (ganador === b) return 1;
      return 0;
    };

    const orden = ordenarGrupo(standings, headToHead);
    const tamano = orden.length;

    orden.forEach((s, idx) => {
      let tramo: "oro" | "plata" | "bronce";
      if (tamano >= 4) {
        tramo = idx < 2 ? "oro" : idx === 2 ? "plata" : "bronce";
      } else {
        tramo = idx === 0 ? "oro" : idx === 1 ? "plata" : "bronce";
      }
      tramosAsignados.push({ pairId: s.pair_id, tramo, posicionGlobal: idx });
    });
  }

  for (const tramo of ["oro", "plata", "bronce"] as const) {
    const parejas = tramosAsignados
      .filter((t) => t.tramo === tramo)
      .sort((a, b) => a.posicionGlobal - b.posicionGlobal)
      .map((t) => t.pairId);

    if (parejas.length < 2) continue;

    await admin
      .from("brackets")
      .delete()
      .eq("tournament_id", torneoId)
      .eq("categoria_id", categoriaId)
      .eq("tramo", tramo);
    await admin
      .from("matches")
      .delete()
      .eq("tournament_id", torneoId)
      .eq("categoria_id", categoriaId)
      .eq("tramo", tramo);

    await admin.from("brackets").insert({
      tournament_id: torneoId,
      categoria_id: categoriaId,
      tramo,
      estructura_json: { num_parejas: parejas.length },
    });

    const totalSlots = nextPow2(parejas.length);
    const numRondas = Math.log2(totalSlots);

    // Construye el árbol desde la final hacia atrás, enlazando cada
    // partido con el de la siguiente ronda (siguiente_match_id/slot)
    let rondaActual: string[] = [];

    const { data: final } = await admin
      .from("matches")
      .insert({
        tournament_id: torneoId,
        categoria_id: categoriaId,
        fase: "final",
        tramo,
        estado: "pendiente",
      })
      .select("id")
      .single();
    if (!final) continue;
    rondaActual = [final.id];

    for (let r = numRondas - 1; r >= 1; r--) {
      const numPartidos = totalSlots / 2 ** r;
      const nuevaRonda: string[] = [];
      for (let i = 0; i < numPartidos; i++) {
        const siguienteMatchId = rondaActual[Math.floor(i / 2)];
        const siguienteSlot = i % 2 === 0 ? 1 : 2;
        const { data: m } = await admin
          .from("matches")
          .insert({
            tournament_id: torneoId,
            categoria_id: categoriaId,
            fase: FASE_POR_NUM_PARTIDOS[numPartidos] ?? "octavos",
            tramo,
            estado: "pendiente",
            siguiente_match_id: siguienteMatchId,
            siguiente_slot: siguienteSlot,
          })
          .select("id")
          .single();
        if (m) nuevaRonda.push(m.id);
      }
      rondaActual = nuevaRonda;
    }

    // rondaActual = partidos de la primera ronda real (huecos vacíos)
    const numByes = totalSlots - parejas.length;
    const byes = parejas.slice(0, numByes);
    const resto = parejas.slice(numByes);

    for (let i = 0; i < byes.length; i++) {
      const matchId = rondaActual[i];
      await admin
        .from("matches")
        .update({
          pair_1_id: byes[i],
          estado: "finalizado",
          resultado_json: { bye: true, ganador_id: byes[i] },
        })
        .eq("id", matchId);
      await advanceWinner(admin, matchId, byes[i]);
    }

    for (let i = 0; i < resto.length / 2; i++) {
      const matchId = rondaActual[byes.length + i];
      await admin
        .from("matches")
        .update({
          pair_1_id: resto[i],
          pair_2_id: resto[resto.length - 1 - i],
        })
        .eq("id", matchId);
    }
  }

  revalidatePath(`/admin/torneos/${torneoId}/cuadros`);
  return { ok: true };
}