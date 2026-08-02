// Ruta: src/app/(admin)/admin/torneos/[id]/actions.ts
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateTournamentEstado(
  torneoId: string,
  estado: string
) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("tournaments")
    .update({ estado })
    .eq("id", torneoId);

  if (error) return { ok: false, error: "No se ha podido cambiar el estado" };
  revalidatePath(`/admin/torneos/${torneoId}`);
  return { ok: true };
}

export async function setTournamentCategory(
  torneoId: string,
  categoriaId: string,
  activa: boolean,
  cupoMinimo: number,
  cupoMaximo: number
) {
  await requireAdmin();
  const admin = createAdminClient();

  if (!activa) {
    await admin
      .from("tournament_categories")
      .delete()
      .eq("tournament_id", torneoId)
      .eq("categoria_id", categoriaId);
    revalidatePath(`/admin/torneos/${torneoId}`);
    return { ok: true };
  }

  const { error } = await admin.from("tournament_categories").upsert(
    {
      tournament_id: torneoId,
      categoria_id: categoriaId,
      cupo_minimo: cupoMinimo,
      cupo_maximo: cupoMaximo,
    },
    { onConflict: "tournament_id,categoria_id" }
  );

  if (error) return { ok: false, error: "No se ha podido guardar la categoría" };
  revalidatePath(`/admin/torneos/${torneoId}`);
  return { ok: true };
}