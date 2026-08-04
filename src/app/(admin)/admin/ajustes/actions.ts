// Ruta: src/app/(admin)/admin/ajustes/actions.ts
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function crearClub(data: {
  nombre: string;
  direccion: string;
  num_pistas: number;
  telefono: string;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("clubs").insert({
    nombre: data.nombre,
    direccion: data.direccion || null,
    num_pistas: data.num_pistas || null,
    telefono: data.telefono || null,
  });

  if (error) return { ok: false, error: "No se ha podido crear el club" };
  revalidatePath("/admin/ajustes");
  return { ok: true };
}