// Ruta: src/app/(private)/app/notificaciones/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function marcarLeida(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No has iniciado sesión" };

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!player) return { ok: false, error: "No se ha encontrado tu perfil" };

  const { error } = await supabase
    .from("notifications")
    .update({ leido: true })
    .eq("id", id)
    .eq("player_id", player.id);
  if (error) return { ok: false, error: "No se ha podido actualizar la notificación" };

  revalidatePath("/app/notificaciones");
  return { ok: true };
}
