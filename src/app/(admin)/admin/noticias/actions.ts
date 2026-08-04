// Ruta: src/app/(admin)/admin/noticias/actions.ts
"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function slugify(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function crearNoticia(data: {
  titulo: string;
  contenido: string;
  imagen_destacada: string;
  categoria: string;
  publicar: boolean;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("news").insert({
    titulo: data.titulo,
    slug: slugify(data.titulo) + "-" + Date.now().toString().slice(-5),
    contenido: data.contenido,
    imagen_destacada: data.imagen_destacada || null,
    categoria: data.categoria || null,
    estado: data.publicar ? "publicado" : "borrador",
    fecha_publicacion: data.publicar ? new Date().toISOString() : null,
  });

  if (error) return { ok: false, error: "No se ha podido crear la noticia" };
  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
  return { ok: true };
}

export async function togglePublicarNoticia(id: string, publicar: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("news")
    .update({
      estado: publicar ? "publicado" : "borrador",
      fecha_publicacion: publicar ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
  return { ok: true };
}

export async function borrarNoticia(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("news").delete().eq("id", id);
  revalidatePath("/admin/noticias");
  return { ok: true };
}