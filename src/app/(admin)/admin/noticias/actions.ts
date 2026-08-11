// Ruta: src/app/(admin)/admin/noticias/actions.ts
"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const noticiaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, { message: "El título debe tener al menos 3 caracteres" })
    .max(180, { message: "El título es demasiado largo" }),
  contenido: z
    .string()
    .trim()
    .min(1, { message: "El contenido es obligatorio" }),
  imagen_destacada: z
    .string()
    .trim()
    .max(1000, { message: "La URL de la imagen es demasiado larga" }),
  categoria: z
    .string()
    .trim()
    .max(60, { message: "La categoría no es válida" }),
  publicar: z.boolean(),
});

const noticiaUpdateSchema = noticiaSchema.omit({
  publicar: true,
});

const noticiaIdSchema = z.string().uuid({
  message: "Identificador de noticia no válido",
});

const categoriasPermitidas = new Set([
  "cronica",
  "entrevista",
  "anuncio",
]);

function slugify(texto: string) {
  const slug = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "noticia";
}

function revalidateNoticias() {
  revalidatePath("/admin/noticias");
  revalidatePath("/noticias");
  revalidatePath("/");
}

export async function crearNoticia(data: {
  titulo: string;
  contenido: string;
  imagen_destacada: string;
  categoria: string;
  publicar: boolean;
}) {
  await requireAdmin();

  const parsed = noticiaSchema.safeParse(data);

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Los datos de la noticia no son válidos",
    };
  }

  if (
    parsed.data.categoria &&
    !categoriasPermitidas.has(parsed.data.categoria)
  ) {
    return {
      ok: false,
      error: "La categoría seleccionada no es válida",
    };
  }

  const admin = createAdminClient();

  const baseSlug = slugify(parsed.data.titulo);

  const { data: slugExistente, error: slugError } = await admin
    .from("news")
    .select("id")
    .eq("slug", baseSlug)
    .maybeSingle();

  if (slugError) {
    console.error(
      "[admin/noticias] Error comprobando slug:",
      slugError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar la URL de la noticia",
    };
  }

  const slug = slugExistente
    ? `${baseSlug}-${Date.now().toString().slice(-6)}`
    : baseSlug;

  const { error } = await admin.from("news").insert({
    titulo: parsed.data.titulo,
    slug,
    contenido: parsed.data.contenido,
    imagen_destacada: parsed.data.imagen_destacada || null,
    categoria: parsed.data.categoria || null,
    estado: parsed.data.publicar ? "publicado" : "borrador",
    fecha_publicacion: parsed.data.publicar
      ? new Date().toISOString()
      : null,
  });

  if (error) {
    console.error(
      "[admin/noticias] Error creando noticia:",
      error
    );

    return {
      ok: false,
      error: "No se ha podido crear la noticia",
    };
  }

  revalidateNoticias();

  return {
    ok: true,
  };
}

export async function actualizarNoticia(
  id: string,
  data: {
    titulo: string;
    contenido: string;
    imagen_destacada: string;
    categoria: string;
  }
) {
  await requireAdmin();

  const parsedId = noticiaIdSchema.safeParse(id);

  if (!parsedId.success) {
    return {
      ok: false,
      error: "Identificador de noticia no válido",
    };
  }

  const parsed = noticiaUpdateSchema.safeParse(data);

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Los datos de la noticia no son válidos",
    };
  }

  if (
    parsed.data.categoria &&
    !categoriasPermitidas.has(parsed.data.categoria)
  ) {
    return {
      ok: false,
      error: "La categoría seleccionada no es válida",
    };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("news")
    .update({
      titulo: parsed.data.titulo,
      contenido: parsed.data.contenido,
      imagen_destacada: parsed.data.imagen_destacada || null,
      categoria: parsed.data.categoria || null,
    })
    .eq("id", parsedId.data);

  if (error) {
    console.error(
      "[admin/noticias] Error actualizando noticia:",
      error
    );

    return {
      ok: false,
      error: "No se ha podido actualizar la noticia",
    };
  }

  revalidateNoticias();

  return {
    ok: true,
  };
}

export async function togglePublicarNoticia(
  id: string,
  publicar: boolean
) {
  await requireAdmin();

  const parsedId = noticiaIdSchema.safeParse(id);

  if (!parsedId.success) {
    return {
      ok: false,
      error: "Identificador de noticia no válido",
    };
  }

  const admin = createAdminClient();

  const { data: noticia, error: fetchError } = await admin
    .from("news")
    .select("id, estado")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (fetchError) {
    console.error(
      "[admin/noticias] Error consultando noticia:",
      fetchError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar la noticia",
    };
  }

  if (!noticia) {
    return {
      ok: false,
      error: "La noticia ya no existe",
    };
  }

  const nuevoEstado = publicar ? "publicado" : "borrador";

  if (noticia.estado === nuevoEstado) {
    return {
      ok: true,
    };
  }

  const { error } = await admin
    .from("news")
    .update({
      estado: nuevoEstado,
      fecha_publicacion: publicar
        ? new Date().toISOString()
        : null,
    })
    .eq("id", parsedId.data);

  if (error) {
    console.error(
      "[admin/noticias] Error cambiando publicación:",
      error
    );

    return {
      ok: false,
      error: publicar
        ? "No se ha podido publicar la noticia"
        : "No se ha podido despublicar la noticia",
    };
  }

  revalidateNoticias();

  return {
    ok: true,
  };
}

export async function borrarNoticia(id: string) {
  await requireAdmin();

  const parsedId = noticiaIdSchema.safeParse(id);

  if (!parsedId.success) {
    return {
      ok: false,
      error: "Identificador de noticia no válido",
    };
  }

  const admin = createAdminClient();

  const { data: noticia, error: fetchError } = await admin
    .from("news")
    .select("id, estado")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (fetchError) {
    console.error(
      "[admin/noticias] Error comprobando noticia antes de borrar:",
      fetchError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar la noticia",
    };
  }

  if (!noticia) {
    return {
      ok: false,
      error: "La noticia ya no existe",
    };
  }

  if (noticia.estado === "publicado") {
    return {
      ok: false,
      error:
        "Una noticia publicada debe despublicarse antes de poder eliminarse",
    };
  }

  const { error } = await admin
    .from("news")
    .delete()
    .eq("id", parsedId.data);

  if (error) {
    console.error(
      "[admin/noticias] Error eliminando noticia:",
      error
    );

    return {
      ok: false,
      error: "No se ha podido eliminar la noticia",
    };
  }

  revalidateNoticias();

  return {
    ok: true,
  };
}