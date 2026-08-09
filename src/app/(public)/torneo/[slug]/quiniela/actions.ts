// Ruta: src/app/(public)/torneo/[slug]/quiniela/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function votar(slug: string, matchId: string, parejaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión para votar" };

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!player) return { ok: false, error: "Perfil no encontrado" };

  const { error } = await supabase.from("predicciones").upsert(
    { match_id: matchId, player_id: player.id, pareja_predicha_id: parejaId },
    { onConflict: "match_id,player_id" }
  );

  if (error) return { ok: false, error: "No se ha podido guardar tu voto" };
  revalidatePath(`/torneo/${slug}/quiniela`);
  return { ok: true };
}