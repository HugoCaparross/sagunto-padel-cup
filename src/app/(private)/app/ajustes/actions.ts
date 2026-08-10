// Ruta: src/app/(private)/app/ajustes/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function cambiarPassword(nuevaPassword: string) {
  if (nuevaPassword.length < 6) {
    return { ok: false, error: "Mínimo 6 caracteres" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No has iniciado sesión" };

  const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
  if (error) return { ok: false, error: "No se ha podido cambiar la contraseña" };
  return { ok: true };
}

export async function darseDeBaja() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No has iniciado sesión" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("players")
    .update({ estado: "baja" })
    .eq("auth_user_id", user.id);
  if (error) return { ok: false, error: "No se ha podido tramitar la baja" };

  await supabase.auth.signOut();
  redirect("/");
}
