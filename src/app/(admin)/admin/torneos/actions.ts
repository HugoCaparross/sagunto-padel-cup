// Ruta: src/app/(admin)/admin/torneos/actions.ts
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { tournamentSchema } from "@/lib/validations/tournament";
import { revalidatePath } from "next/cache";

function slugify(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createTournament(formData: unknown) {
  await requireAdmin();

  const parsed = tournamentSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Datos no válidos" };
  }
  const { nombre, fecha_inicio, fecha_fin } = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin.from("tournaments").insert({
    nombre,
    slug: slugify(nombre),
    fecha_inicio,
    fecha_fin,
    estado: "borrador",
  });

  if (error) {
    return { ok: false, error: "No se ha podido crear el torneo" };
  }

  revalidatePath("/admin/torneos");
  return { ok: true };
}