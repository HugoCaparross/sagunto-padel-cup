// Ruta: src/app/(admin)/admin/torneos/[id]/premios/actions.ts
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function crearPremio(
  torneoId: string,
  data: {
    categoria_id: string;
    tramo: string;
    posicion: string;
    descripcion: string;
    patrocinador_id: string | null;
  }
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("premios").insert({
    tournament_id: torneoId,
    categoria_id: data.categoria_id || null,
    tramo: data.tramo || null,
    posicion: data.posicion || null,
    descripcion: data.descripcion,
    patrocinador_id: data.patrocinador_id || null,
    visible: false,
  });

  if (error) return { ok: false, error: "No se ha podido crear el premio" };
  revalidatePath(`/admin/torneos/${torneoId}/premios`);
  return { ok: true };
}

export async function toggleVisiblePremio(
  torneoId: string,
  premioId: string,
  visible: boolean
) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("premios").update({ visible }).eq("id", premioId);
  revalidatePath(`/admin/torneos/${torneoId}/premios`);
  return { ok: true };
}

export async function borrarPremio(torneoId: string, premioId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("premios").delete().eq("id", premioId);
  revalidatePath(`/admin/torneos/${torneoId}/premios`);
  return { ok: true };
}