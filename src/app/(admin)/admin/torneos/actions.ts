// Ruta: src/app/(admin)/admin/torneos/actions.ts
"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const createTournamentSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, { message: "Introduce un nombre válido" })
      .max(150, { message: "El nombre es demasiado largo" }),

    fecha_inicio: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "La fecha de inicio no es válida",
      }),

    fecha_fin: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "La fecha de fin no es válida",
      }),
  })
  .superRefine((data, ctx) => {
    const inicio = new Date(`${data.fecha_inicio}T00:00:00`);
    const fin = new Date(`${data.fecha_fin}T00:00:00`);

    if (
      Number.isNaN(inicio.getTime()) ||
      Number.isNaN(fin.getTime())
    ) {
      return;
    }

    if (fin < inicio) {
      ctx.addIssue({
        code: "custom",
        path: ["fecha_fin"],
        message:
          "La fecha de fin no puede ser anterior a la fecha de inicio",
      });
    }
  });

function slugify(nombre: string) {
  const slug = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "torneo";
}

export async function createTournament(formData: unknown) {
  await requireAdmin();

  const parsed = createTournamentSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Los datos del torneo no son válidos",
    };
  }

  const { nombre, fecha_inicio, fecha_fin } = parsed.data;

  const admin = createAdminClient();
  const slug = slugify(nombre);

  const { data: slugExistente, error: slugError } = await admin
    .from("tournaments")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugError) {
    console.error(
      "[admin/torneos] Error comprobando slug:",
      slugError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar la URL del torneo",
    };
  }

  if (slugExistente) {
    return {
      ok: false,
      error:
        "Ya existe un torneo con ese nombre. Utiliza un nombre diferente.",
    };
  }

  const { error } = await admin.from("tournaments").insert({
    nombre,
    slug,
    fecha_inicio,
    fecha_fin,
    estado: "borrador",
  });

  if (error) {
    console.error(
      "[admin/torneos] Error creando torneo:",
      error
    );

    return {
      ok: false,
      error: "No se ha podido crear el torneo",
    };
  }

  revalidatePath("/admin/torneos");
  revalidatePath("/calendario");
  revalidatePath("/");

  return {
    ok: true,
  };
}