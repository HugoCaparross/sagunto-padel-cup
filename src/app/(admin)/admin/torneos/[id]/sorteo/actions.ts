// Ruta: src/app/(admin)/admin/torneos/[id]/sorteo/actions.ts — sustituye entero al archivo actual
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateGroups, roundRobin } from "@/lib/sorteo";
import { revalidatePath } from "next/cache";

const LETRAS = "ABCDEFGHIJKLMNOP".split("");
const DURACION_GRUPOS_MIN = 40; // minutos por partido de grupos, con cambio de pista

export async function generarSorteo(torneoId: string, categoriaId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: pairs } = await admin
    .from("pairs")
    .select("id, cabeza_de_serie")
    .eq("tournament_id", torneoId)
    .eq("categoria_id", categoriaId)
    .eq("estado", "confirmada");

  if (!pairs || pairs.length < 3) {
    return { ok: false, error: "Hacen falta al menos 3 parejas confirmadas" };
  }

  const { data: gruposAnteriores } = await admin
    .from("groups")
    .select("id")
    .eq("tournament_id", torneoId)
    .eq("categoria_id", categoriaId);

  if (gruposAnteriores?.length) {
    await admin
      .from("group_standings")
      .delete()
      .in("group_id", gruposAnteriores.map((g) => g.id));
    await admin
      .from("matches")
      .delete()
      .eq("tournament_id", torneoId)
      .eq("categoria_id", categoriaId)
      .eq("fase", "grupos");
    await admin
      .from("groups")
      .delete()
      .eq("tournament_id", torneoId)
      .eq("categoria_id", categoriaId);
  }

  const { data: torneo } = await admin
    .from("tournaments")
    .select("club_id, fecha_inicio")
    .eq("id", torneoId)
    .single();

  let numPistas = 4;
  if (torneo?.club_id) {
    const { data: club } = await admin
      .from("clubs")
      .select("num_pistas")
      .eq("id", torneo.club_id)
      .single();
    numPistas = club?.num_pistas ?? 4;
  }

  // Hora de inicio: 09:00 del día del torneo, en la zona horaria del servidor.
  // Cada pista tiene su propio "siguiente hueco libre" y avanza independiente.
  const inicioBase = new Date(`${torneo?.fecha_inicio ?? new Date().toISOString().slice(0, 10)}T09:00:00`);
  const siguienteHuecoPorPista: Date[] = Array.from({ length: numPistas }, () => new Date(inicioBase));

  const grupos = generateGroups(pairs);
  let contadorPista = 0;

  for (let i = 0; i < grupos.length; i++) {
    const { data: grupo, error } = await admin
      .from("groups")
      .insert({
        tournament_id: torneoId,
        categoria_id: categoriaId,
        nombre: `Grupo ${LETRAS[i]}`,
      })
      .select("id")
      .single();

    if (error || !grupo) continue;

    await admin
      .from("group_standings")
      .insert(grupos[i].map((pairId) => ({ group_id: grupo.id, pair_id: pairId })));

    const partidos = roundRobin(grupos[i]);
    for (const [pair1, pair2] of partidos) {
      const pistaIndex = contadorPista % numPistas;
      const pista = `Pista ${pistaIndex + 1}`;
      const horaProgramada = new Date(siguienteHuecoPorPista[pistaIndex]);
      siguienteHuecoPorPista[pistaIndex] = new Date(
        horaProgramada.getTime() + DURACION_GRUPOS_MIN * 60000
      );
      contadorPista++;

      await admin.from("matches").insert({
        tournament_id: torneoId,
        categoria_id: categoriaId,
        fase: "grupos",
        group_id: grupo.id,
        pair_1_id: pair1,
        pair_2_id: pair2,
        pista,
        hora_programada: horaProgramada.toISOString(),
        estado: "pendiente",
      });
    }
  }

  revalidatePath(`/admin/torneos/${torneoId}/sorteo`);
  revalidatePath(`/admin/torneos/${torneoId}/resultados`);
  revalidatePath(`/admin/torneos/${torneoId}/horarios`);
  revalidatePath(`/torneo/${torneoId}/horarios`);
  return { ok: true };
}