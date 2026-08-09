// Ruta: src/app/(admin)/admin/jugadores/actions.ts — sustituye entero al archivo actual
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function cambiarCategoria(
  playerId: string,
  categoriaNuevaId: string,
  motivo: string
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: jugador } = await admin
    .from("players")
    .select("categoria_actual_id")
    .eq("id", playerId)
    .single();

  await admin
    .from("players")
    .update({ categoria_actual_id: categoriaNuevaId })
    .eq("id", playerId);

  await admin.from("category_changes").insert({
    player_id: playerId,
    categoria_anterior_id: jugador?.categoria_actual_id ?? null,
    categoria_nueva_id: categoriaNuevaId,
    motivo: motivo || "Cambio manual desde el panel admin",
  });

  await admin.from("notifications").insert({
    player_id: playerId,
    tipo: "cambio_categoria",
    canal: "in_app",
    contenido: motivo || "Se ha actualizado tu categoría",
  });

  // Insignia de ascenso: solo si el nuevo nivel_orden es menor (más alto en el circuito)
  if (jugador?.categoria_actual_id) {
    const { data: categorias } = await admin
      .from("categories")
      .select("id, nivel_orden")
      .in("id", [jugador.categoria_actual_id, categoriaNuevaId]);

    const anterior = categorias?.find((c) => c.id === jugador.categoria_actual_id);
    const nueva = categorias?.find((c) => c.id === categoriaNuevaId);

    if (anterior && nueva && nueva.nivel_orden < anterior.nivel_orden) {
      const { data: existente } = await admin
        .from("badges")
        .select("id")
        .eq("player_id", playerId)
        .eq("tipo", "ascenso_categoria")
        .maybeSingle();
      if (!existente) {
        await admin.from("badges").insert({ player_id: playerId, tipo: "ascenso_categoria" });
      }
    }
  }

  revalidatePath("/admin/jugadores");
  return { ok: true };
}

export async function toggleSuspendido(playerId: string, suspender: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("players")
    .update({ estado: suspender ? "suspendido" : "activo" })
    .eq("id", playerId);
  revalidatePath("/admin/jugadores");
  return { ok: true };
}