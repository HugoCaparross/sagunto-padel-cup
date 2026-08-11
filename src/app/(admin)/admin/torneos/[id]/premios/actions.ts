// Ruta: src/app/(admin)/admin/torneos/[id]/premios/actions.ts

"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const uuidSchema = z.string().uuid({
  message: "Identificador no válido",
});

const tramoSchema = z
  .enum(["oro", "plata", "bronce", "sorteo"])
  .or(z.literal(""));

const posicionSchema = z
  .enum([
    "campeon",
    "subcampeon",
    "semifinalista",
    "cuartofinalista",
  ])
  .or(z.literal(""));

const premioSchema = z.object({
  torneoId: uuidSchema,
  categoria_id: z.union([uuidSchema, z.literal("")]),
  tramo: tramoSchema,
  posicion: posicionSchema,
  descripcion: z
    .string()
    .trim()
    .min(1, {
      message: "La descripción del premio es obligatoria",
    })
    .max(1000, {
      message: "La descripción del premio es demasiado larga",
    }),
  patrocinador_id: z.union([uuidSchema, z.literal("")]),
});

const premioUpdateSchema = premioSchema.extend({
  premioId: uuidSchema,
});

const visibleSchema = z.object({
  torneoId: uuidSchema,
  premioId: uuidSchema,
  visible: z.boolean(),
});

async function comprobarTorneo(
  torneoId: string
) {
  const admin = createAdminClient();

  return admin
    .from("tournaments")
    .select("id, slug")
    .eq("id", torneoId)
    .maybeSingle();
}

async function comprobarCategoria(
  torneoId: string,
  categoriaId: string
) {
  const admin = createAdminClient();

  return admin
    .from("tournament_categories")
    .select("categoria_id")
    .eq("tournament_id", torneoId)
    .eq("categoria_id", categoriaId)
    .maybeSingle();
}

async function comprobarPatrocinador(
  torneoId: string,
  patrocinadorId: string
) {
  const admin = createAdminClient();

  return admin
    .from("sponsors")
    .select("id")
    .eq("id", patrocinadorId)
    .eq("tournament_id", torneoId)
    .maybeSingle();
}

async function revalidarPremios(
  torneoId: string,
  slug?: string | null
) {
  revalidatePath(
    `/admin/torneos/${torneoId}/premios`
  );

  revalidatePath("/admin/torneos");

  if (slug) {
    revalidatePath(`/torneo/${slug}/premios`);
    revalidatePath(`/torneo/${slug}`);
  }
}

export async function crearPremio(
  torneoId: string,
  data: {
    categoria_id: string;
    tramo: string;
    posicion: string;
    descripcion: string;
    patrocinador_id: string | null;
  }
) {
  await requireAdmin();

  const parsed = premioSchema.safeParse({
    torneoId,
    categoria_id: data.categoria_id,
    tramo: data.tramo,
    posicion: data.posicion,
    descripcion: data.descripcion,
    patrocinador_id: data.patrocinador_id ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Los datos del premio no son válidos",
    };
  }

  const { data: torneo, error: torneoError } =
    await comprobarTorneo(parsed.data.torneoId);

  if (torneoError) {
    console.error(
      "[admin/premios] Error comprobando torneo:",
      torneoError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar el torneo",
    };
  }

  if (!torneo) {
    return {
      ok: false,
      error: "El torneo no existe",
    };
  }

  if (parsed.data.categoria_id) {
    const { data: categoria, error } =
      await comprobarCategoria(
        parsed.data.torneoId,
        parsed.data.categoria_id
      );

    if (error) {
      console.error(
        "[admin/premios] Error comprobando categoría:",
        error
      );

      return {
        ok: false,
        error:
          "No se ha podido comprobar la categoría",
      };
    }

    if (!categoria) {
      return {
        ok: false,
        error:
          "La categoría no pertenece a este torneo",
      };
    }
  }

  if (parsed.data.patrocinador_id) {
    const { data: sponsor, error } =
      await comprobarPatrocinador(
        parsed.data.torneoId,
        parsed.data.patrocinador_id
      );

    if (error) {
      console.error(
        "[admin/premios] Error comprobando patrocinador:",
        error
      );

      return {
        ok: false,
        error:
          "No se ha podido comprobar el patrocinador",
      };
    }

    if (!sponsor) {
      return {
        ok: false,
        error:
          "El patrocinador no pertenece a este torneo",
      };
    }
  }

  const admin = createAdminClient();

  const { error } = await admin.from("premios").insert({
    tournament_id: parsed.data.torneoId,
    categoria_id:
      parsed.data.categoria_id || null,
    tramo: parsed.data.tramo || null,
    posicion: parsed.data.posicion || null,
    descripcion: parsed.data.descripcion,
    patrocinador_id:
      parsed.data.patrocinador_id || null,
    visible: false,
  });

  if (error) {
    console.error(
      "[admin/premios] Error creando premio:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido crear el premio",
    };
  }

  await revalidarPremios(
    parsed.data.torneoId,
    torneo.slug
  );

  return {
    ok: true,
  };
}

export async function actualizarPremio(
  torneoId: string,
  premioId: string,
  data: {
    categoria_id: string;
    tramo: string;
    posicion: string;
    descripcion: string;
    patrocinador_id: string | null;
  }
) {
  await requireAdmin();

  const parsed = premioUpdateSchema.safeParse({
    torneoId,
    premioId,
    categoria_id: data.categoria_id,
    tramo: data.tramo,
    posicion: data.posicion,
    descripcion: data.descripcion,
    patrocinador_id: data.patrocinador_id ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Los datos del premio no son válidos",
    };
  }

  const { data: torneo, error: torneoError } =
    await comprobarTorneo(parsed.data.torneoId);

  if (torneoError || !torneo) {
    return {
      ok: false,
      error: torneoError
        ? "No se ha podido comprobar el torneo"
        : "El torneo no existe",
    };
  }

  const admin = createAdminClient();

  const { data: premio, error: premioError } =
    await admin
      .from("premios")
      .select("id")
      .eq("id", parsed.data.premioId)
      .eq(
        "tournament_id",
        parsed.data.torneoId
      )
      .maybeSingle();

  if (premioError) {
    console.error(
      "[admin/premios] Error comprobando premio:",
      premioError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar el premio",
    };
  }

  if (!premio) {
    return {
      ok: false,
      error:
        "El premio no existe o no pertenece a este torneo",
    };
  }

  if (parsed.data.categoria_id) {
    const { data: categoria } =
      await comprobarCategoria(
        parsed.data.torneoId,
        parsed.data.categoria_id
      );

    if (!categoria) {
      return {
        ok: false,
        error:
          "La categoría no pertenece a este torneo",
      };
    }
  }

  if (parsed.data.patrocinador_id) {
    const { data: sponsor } =
      await comprobarPatrocinador(
        parsed.data.torneoId,
        parsed.data.patrocinador_id
      );

    if (!sponsor) {
      return {
        ok: false,
        error:
          "El patrocinador no pertenece a este torneo",
      };
    }
  }

  const { error } = await admin
    .from("premios")
    .update({
      categoria_id:
        parsed.data.categoria_id || null,
      tramo: parsed.data.tramo || null,
      posicion: parsed.data.posicion || null,
      descripcion: parsed.data.descripcion,
      patrocinador_id:
        parsed.data.patrocinador_id || null,
    })
    .eq("id", parsed.data.premioId)
    .eq(
      "tournament_id",
      parsed.data.torneoId
    );

  if (error) {
    console.error(
      "[admin/premios] Error actualizando premio:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido actualizar el premio",
    };
  }

  await revalidarPremios(
    parsed.data.torneoId,
    torneo.slug
  );

  return {
    ok: true,
  };
}

export async function toggleVisiblePremio(
  torneoId: string,
  premioId: string,
  visible: boolean
) {
  await requireAdmin();

  const parsed = visibleSchema.safeParse({
    torneoId,
    premioId,
    visible,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Datos de visibilidad no válidos",
    };
  }

  const { data: torneo, error: torneoError } =
    await comprobarTorneo(parsed.data.torneoId);

  if (torneoError || !torneo) {
    return {
      ok: false,
      error: torneoError
        ? "No se ha podido comprobar el torneo"
        : "El torneo no existe",
    };
  }

  const admin = createAdminClient();

  const { data: premio, error: premioError } =
    await admin
      .from("premios")
      .select("id, visible")
      .eq("id", parsed.data.premioId)
      .eq(
        "tournament_id",
        parsed.data.torneoId
      )
      .maybeSingle();

  if (premioError) {
    console.error(
      "[admin/premios] Error comprobando visibilidad:",
      premioError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar el premio",
    };
  }

  if (!premio) {
    return {
      ok: false,
      error:
        "El premio no existe o no pertenece a este torneo",
    };
  }

  const { error } = await admin
    .from("premios")
    .update({
      visible: parsed.data.visible,
    })
    .eq("id", parsed.data.premioId)
    .eq(
      "tournament_id",
      parsed.data.torneoId
    );

  if (error) {
    console.error(
      "[admin/premios] Error cambiando visibilidad:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido actualizar la visibilidad",
    };
  }

  await revalidarPremios(
    parsed.data.torneoId,
    torneo.slug
  );

  return {
    ok: true,
  };
}

export async function borrarPremio(
  torneoId: string,
  premioId: string
) {
  await requireAdmin();

  const parsedTournamentId =
    uuidSchema.safeParse(torneoId);

  const parsedPremioId =
    uuidSchema.safeParse(premioId);

  if (!parsedTournamentId.success) {
    return {
      ok: false,
      error:
        "Identificador de torneo no válido",
    };
  }

  if (!parsedPremioId.success) {
    return {
      ok: false,
      error:
        "Identificador de premio no válido",
    };
  }

  const { data: torneo, error: torneoError } =
    await comprobarTorneo(
      parsedTournamentId.data
    );

  if (torneoError || !torneo) {
    return {
      ok: false,
      error: torneoError
        ? "No se ha podido comprobar el torneo"
        : "El torneo no existe",
    };
  }

  const admin = createAdminClient();

  const { data: premio, error: premioError } =
    await admin
      .from("premios")
      .select("id, visible")
      .eq("id", parsedPremioId.data)
      .eq(
        "tournament_id",
        parsedTournamentId.data
      )
      .maybeSingle();

  if (premioError) {
    console.error(
      "[admin/premios] Error comprobando premio antes de eliminar:",
      premioError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar el premio",
    };
  }

  if (!premio) {
    return {
      ok: false,
      error:
        "El premio no existe o no pertenece a este torneo",
    };
  }

  if (premio.visible) {
    return {
      ok: false,
      error:
        "Un premio visible debe ocultarse antes de eliminarse",
    };
  }

  const { error } = await admin
    .from("premios")
    .delete()
    .eq("id", parsedPremioId.data)
    .eq(
      "tournament_id",
      parsedTournamentId.data
    );

  if (error) {
    console.error(
      "[admin/premios] Error eliminando premio:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido eliminar el premio",
    };
  }

  await revalidarPremios(
    parsedTournamentId.data,
    torneo.slug
  );

  return {
    ok: true,
  };
}