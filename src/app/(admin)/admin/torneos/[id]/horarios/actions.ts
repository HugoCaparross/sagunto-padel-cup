// Ruta: src/app/(admin)/admin/torneos/[id]/horarios/actions.ts
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function actualizarHorario(
  torneoId: string,
  matchId: string,
  pista: string,
  horaProgramada: string
) {
  await requireAdmin();
  const admin = createAdminClient();

  await admin
    .from("matches")
    .update({
      pista,
      hora_programada: horaProgramada ? new Date(horaProgramada).toISOString() : null,
    })
    .eq("id", matchId);

  revalidatePath(`/admin/torneos/${torneoId}/horarios`);
  revalidatePath(`/torneo/${torneoId}/horarios`);
  return { ok: true };
}