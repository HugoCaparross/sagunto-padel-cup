// Ruta: src/app/(admin)/admin/torneos/[id]/inscripciones/actions.ts
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWaitlistPromotedEmail } from "@/lib/email/resend";
import { revalidatePath } from "next/cache";

export async function updatePairEstado(
  torneoId: string,
  pairId: string,
  estado: string
) {
  await requireAdmin();
  const admin = createAdminClient();

  await admin.from("pairs").update({ estado }).eq("id", pairId);
  await admin
    .from("registrations")
    .update({
      estado: estado === "lista_espera" ? "lista_espera" : estado === "confirmada" ? "confirmada" : "cancelada",
    })
    .eq("pair_id", pairId);

  if (estado === "confirmada") {
    const { data: pair } = await admin
      .from("pairs")
      .select("player_1_id, player_2_id")
      .eq("id", pairId)
      .single();

    const { data: torneo } = await admin
      .from("tournaments")
      .select("nombre")
      .eq("id", torneoId)
      .single();

    for (const playerId of [pair?.player_1_id, pair?.player_2_id]) {
      if (!playerId) continue;
      const { data: player } = await admin
        .from("players")
        .select("nombre, email")
        .eq("id", playerId)
        .single();
      if (player && torneo) {
        await sendWaitlistPromotedEmail({
          to: player.email,
          nombre: player.nombre,
          torneoNombre: torneo.nombre,
        });
      }
    }
  }

  revalidatePath(`/admin/torneos/${torneoId}/inscripciones`);
  return { ok: true };
}

export async function toggleCheckIn(
  torneoId: string,
  registrationId: string,
  checkedIn: boolean
) {
  await requireAdmin();
  const admin = createAdminClient();

  await admin
    .from("registrations")
    .update({
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null,
    })
    .eq("id", registrationId);

  revalidatePath(`/admin/torneos/${torneoId}/inscripciones`);
  return { ok: true };
}