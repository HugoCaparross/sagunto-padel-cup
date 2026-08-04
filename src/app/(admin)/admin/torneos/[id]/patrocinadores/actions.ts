// Ruta: src/app/(admin)/admin/torneos/[id]/patrocinadores/actions.ts
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function crearSponsor(
  torneoId: string,
  data: { nombre: string; logo_url: string; descripcion: string; enlace: string; tipo: "comercial" | "institucion" }
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("sponsors").insert({
    tournament_id: torneoId,
    nombre: data.nombre,
    logo_url: data.logo_url || null,
    descripcion: data.descripcion || null,
    enlace: data.enlace || null,
    tipo: data.tipo,
    orden: 0,
  });

  if (error) return { ok: false, error: "No se ha podido crear" };
  revalidatePath(`/admin/torneos/${torneoId}/patrocinadores`);
  return { ok: true };
}

export async function borrarSponsor(torneoId: string, sponsorId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("sponsors").delete().eq("id", sponsorId);
  revalidatePath(`/admin/torneos/${torneoId}/patrocinadores`);
  return { ok: true };
}