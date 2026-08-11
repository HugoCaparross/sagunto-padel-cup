// Ruta: src/app/(admin)/admin/ajustes/actions.ts
"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const clubSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { message: "El nombre del club es obligatorio" })
    .max(120, { message: "El nombre del club es demasiado largo" }),
  direccion: z
    .string()
    .trim()
    .max(250, { message: "La dirección es demasiado larga" }),
  num_pistas: z
    .number()
    .int({ message: "El número de pistas debe ser entero" })
    .min(1, { message: "El club debe tener al menos una pista" })
    .max(100, { message: "El número de pistas no es válido" }),
  telefono: z
    .string()
    .trim()
    .max(30, { message: "El teléfono es demasiado largo" }),
});

const clubUpdateSchema = clubSchema.extend({
  clubId: z.string().uuid({ message: "Identificador de club no válido" }),
});

function revalidateClubContext() {
  revalidatePath("/admin/ajustes");
  revalidatePath("/admin/torneos");
  revalidatePath("/calendario");
  revalidatePath("/");
}

export async function crearClub(data: {
  nombre: string;
  direccion: string;
  num_pistas: number;
  telefono: string;
}) {
  await requireAdmin();

  const parsed = clubSchema.safeParse({
    nombre: data.nombre,
    direccion: data.direccion,
    num_pistas: data.num_pistas,
    telefono: data.telefono,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos del club no válidos",
    };
  }

  const admin = createAdminClient();

  const { error } = await admin.from("clubs").insert({
    nombre: parsed.data.nombre,
    direccion: parsed.data.direccion || null,
    num_pistas: parsed.data.num_pistas,
    telefono: parsed.data.telefono || null,
  });

  if (error) {
    console.error("[admin/ajustes] Error al crear club:", error);

    return {
      ok: false,
      error: "No se ha podido crear el club",
    };
  }

  revalidateClubContext();

  return {
    ok: true,
  };
}

export async function actualizarClub(data: {
  clubId: string;
  nombre: string;
  direccion: string;
  num_pistas: number;
  telefono: string;
}) {
  await requireAdmin();

  const parsed = clubUpdateSchema.safeParse({
    clubId: data.clubId,
    nombre: data.nombre,
    direccion: data.direccion,
    num_pistas: data.num_pistas,
    telefono: data.telefono,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos del club no válidos",
    };
  }

  const admin = createAdminClient();

  const { data: club, error: fetchError } = await admin
    .from("clubs")
    .select("id")
    .eq("id", parsed.data.clubId)
    .maybeSingle();

  if (fetchError) {
    console.error("[admin/ajustes] Error al consultar club:", fetchError);

    return {
      ok: false,
      error: "No se ha podido comprobar el club",
    };
  }

  if (!club) {
    return {
      ok: false,
      error: "El club ya no existe",
    };
  }

  const { error } = await admin
    .from("clubs")
    .update({
      nombre: parsed.data.nombre,
      direccion: parsed.data.direccion || null,
      num_pistas: parsed.data.num_pistas,
      telefono: parsed.data.telefono || null,
    })
    .eq("id", parsed.data.clubId);

  if (error) {
    console.error("[admin/ajustes] Error al actualizar club:", error);

    return {
      ok: false,
      error: "No se ha podido actualizar el club",
    };
  }

  revalidateClubContext();

  return {
    ok: true,
  };
}