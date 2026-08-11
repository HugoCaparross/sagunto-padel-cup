// Ruta: src/app/(admin)/admin/jugadores/actions.ts
"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const playerIdSchema = z.string().uuid({
  message: "Identificador de jugador no válido",
});

const categoryChangeSchema = z.object({
  playerId: playerIdSchema,
  categoriaNuevaId: z.string().uuid({
    message: "Categoría no válida",
  }),
  motivo: z
    .string()
    .trim()
    .min(3, { message: "El motivo del cambio es obligatorio" })
    .max(500, { message: "El motivo es demasiado largo" }),
});

const suspendSchema = z.object({
  playerId: playerIdSchema,
  suspender: z.boolean(),
  motivo: z
    .string()
    .trim()
    .max(500, { message: "El motivo es demasiado largo" }),
});

export async function cambiarCategoria(
  playerId: string,
  categoriaNuevaId: string,
  motivo: string
) {
  await requireAdmin();

  const parsed = categoryChangeSchema.safeParse({
    playerId,
    categoriaNuevaId,
    motivo,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "No se ha podido validar el cambio de categoría",
    };
  }

  const admin = createAdminClient();

  const { data: jugador, error: jugadorError } = await admin
    .from("players")
    .select("id, categoria_actual_id")
    .eq("id", parsed.data.playerId)
    .maybeSingle();

  if (jugadorError) {
    console.error("[admin/jugadores] Error consultando jugador:", jugadorError);

    return {
      ok: false,
      error: "No se ha podido comprobar el jugador",
    };
  }

  if (!jugador) {
    return {
      ok: false,
      error: "El jugador ya no existe",
    };
  }

  const { data: categoria, error: categoriaError } = await admin
    .from("categories")
    .select("id")
    .eq("id", parsed.data.categoriaNuevaId)
    .maybeSingle();

  if (categoriaError) {
    console.error(
      "[admin/jugadores] Error consultando categoría:",
      categoriaError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar la categoría",
    };
  }

  if (!categoria) {
    return {
      ok: false,
      error: "La categoría seleccionada no existe",
    };
  }

  if (jugador.categoria_actual_id === parsed.data.categoriaNuevaId) {
    return {
      ok: false,
      error: "El jugador ya pertenece a esa categoría",
    };
  }

  const { error: updateError } = await admin
    .from("players")
    .update({
      categoria_actual_id: parsed.data.categoriaNuevaId,
    })
    .eq("id", parsed.data.playerId);

  if (updateError) {
    console.error(
      "[admin/jugadores] Error actualizando categoría:",
      updateError
    );

    return {
      ok: false,
      error: "No se ha podido actualizar la categoría",
    };
  }

  const { error: historyError } = await admin
    .from("category_changes")
    .insert({
      player_id: parsed.data.playerId,
      categoria_anterior_id: jugador.categoria_actual_id ?? null,
      categoria_nueva_id: parsed.data.categoriaNuevaId,
      motivo: parsed.data.motivo,
    });

  if (historyError) {
    console.error(
      "[admin/jugadores] Error registrando cambio de categoría:",
      historyError
    );

    return {
      ok: false,
      error:
        "La categoría se ha actualizado, pero no se ha podido registrar el cambio",
    };
  }

  const { error: notificationError } = await admin
    .from("notifications")
    .insert({
      player_id: parsed.data.playerId,
      tipo: "cambio_categoria",
      canal: "in_app",
      contenido: parsed.data.motivo,
    });

  if (notificationError) {
    console.error(
      "[admin/jugadores] Error creando notificación:",
      notificationError
    );
  }

  revalidatePath("/admin/jugadores");
  revalidatePath(`/jugador/${parsed.data.playerId}`);
  revalidatePath("/ranking");

  return {
    ok: true,
  };
}

export async function toggleSuspendido(
  playerId: string,
  suspender: boolean,
  motivo = ""
) {
  await requireAdmin();

  const parsed = suspendSchema.safeParse({
    playerId,
    suspender,
    motivo,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "No se ha podido validar el cambio de estado",
    };
  }

  if (parsed.data.suspender && !parsed.data.motivo) {
    return {
      ok: false,
      error: "Debes indicar el motivo de la suspensión",
    };
  }

  const admin = createAdminClient();

  const { data: jugador, error: jugadorError } = await admin
    .from("players")
    .select("id, estado")
    .eq("id", parsed.data.playerId)
    .maybeSingle();

  if (jugadorError) {
    console.error(
      "[admin/jugadores] Error consultando estado del jugador:",
      jugadorError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar el jugador",
    };
  }

  if (!jugador) {
    return {
      ok: false,
      error: "El jugador ya no existe",
    };
  }

  const nuevoEstado = parsed.data.suspender ? "suspendido" : "activo";

  if (jugador.estado === nuevoEstado) {
    return {
      ok: true,
    };
  }

  const { error: updateError } = await admin
    .from("players")
    .update({
      estado: nuevoEstado,
    })
    .eq("id", parsed.data.playerId);

  if (updateError) {
    console.error(
      "[admin/jugadores] Error actualizando estado:",
      updateError
    );

    return {
      ok: false,
      error: "No se ha podido actualizar el estado del jugador",
    };
  }

  if (parsed.data.suspender) {
    const { error: notificationError } = await admin
      .from("notifications")
      .insert({
        player_id: parsed.data.playerId,
        tipo: "cuenta_suspendida",
        canal: "in_app",
        contenido: parsed.data.motivo,
      });

    if (notificationError) {
      console.error(
        "[admin/jugadores] Error creando notificación de suspensión:",
        notificationError
      );
    }
  }

  revalidatePath("/admin/jugadores");
  revalidatePath(`/jugador/${parsed.data.playerId}`);

  return {
    ok: true,
  };
}