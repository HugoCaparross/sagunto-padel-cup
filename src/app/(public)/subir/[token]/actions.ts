// Ruta: src/app/(public)/subir/[token]/actions.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function subirFotoColaborador(token: string, formData: FormData) {
  const admin = createAdminClient();

  const { data: acceso } = await admin
    .from("gallery_upload_access")
    .select("tournament_id, nombre_colaborador, fecha_expiracion")
    .eq("token_acceso", token)
    .single();

  if (!acceso) return { ok: false, error: "Enlace no válido" };
  if (acceso.fecha_expiracion && new Date(acceso.fecha_expiracion) < new Date()) {
    return { ok: false, error: "Este enlace ha caducado" };
  }

  const file = formData.get("foto") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Selecciona una foto" };

  const path = `${acceso.tournament_id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await admin.storage.from("galeria").upload(path, file);
  if (uploadError) return { ok: false, error: "No se ha podido subir la foto" };

  const { data: urlData } = admin.storage.from("galeria").getPublicUrl(path);

  await admin.from("gallery_items").insert({
    tournament_id: acceso.tournament_id,
    url: urlData.publicUrl,
    tipo: "foto",
    subido_por: acceso.nombre_colaborador,
  });

  revalidatePath(`/subir/${token}`);
  return { ok: true };
}