// Ruta: src/app/(private)/app/perfil/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function actualizarPerfil(data: {
  ciudad: string;
  mano_dominante: string;
  pala: string;
  instagram: string;
  visibilidad_json: Record<string, boolean>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No has iniciado sesión" };

  const { error } = await supabase
    .from("players")
    .update({
      ciudad: data.ciudad || null,
      mano_dominante: data.mano_dominante || null,
      pala: data.pala || null,
      instagram: data.instagram || null,
      visibilidad_json: data.visibilidad_json,
    })
    .eq("auth_user_id", user.id);

  if (error) return { ok: false, error: "No se ha podido guardar" };
  revalidatePath("/app/perfil");
  return { ok: true };
}