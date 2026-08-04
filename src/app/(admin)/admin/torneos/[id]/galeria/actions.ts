// Ruta: src/app/(admin)/admin/torneos/[id]/galeria/actions.ts — sustituye entero al archivo actual
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function subirFoto(torneoId: string, formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const file = formData.get("foto") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Selecciona una foto" };

  const path = `${torneoId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await admin.storage.from("galeria").upload(path, file);
  if (uploadError) return { ok: false, error: "No se ha podido subir la foto" };

  const { data: urlData } = admin.storage.from("galeria").getPublicUrl(path);

  await admin.from("gallery_items").insert({
    tournament_id: torneoId,
    url: urlData.publicUrl,
    tipo: "foto",
    subido_por: "admin",
  });

  revalidatePath(`/admin/torneos/${torneoId}/galeria`);
  return { ok: true };
}

export async function borrarFoto(torneoId: string, itemId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("gallery_items").delete().eq("id", itemId);
  revalidatePath(`/admin/torneos/${torneoId}/galeria`);
  return { ok: true };
}

export async function crearAccesoColaborador(
  torneoId: string,
  nombreColaborador: string,
  diasValidez: number
) {
  await requireAdmin();
  const admin = createAdminClient();

  const fechaExpiracion = new Date();
  fechaExpiracion.setDate(fechaExpiracion.getDate() + diasValidez);

  const { data, error } = await admin
    .from("gallery_upload_access")
    .insert({
      tournament_id: torneoId,
      nombre_colaborador: nombreColaborador,
      fecha_expiracion: fechaExpiracion.toISOString(),
    })
    .select("token_acceso")
    .single();

  if (error || !data) return { ok: false, error: "No se ha podido crear el acceso" };
  revalidatePath(`/admin/torneos/${torneoId}/galeria`);
  return { ok: true, token: data.token_acceso };
}