// Ruta: src/app/(private)/app/notificaciones/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function marcarLeida(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ leido: true }).eq("id", id);
  revalidatePath("/app/notificaciones");
  return { ok: true };
}