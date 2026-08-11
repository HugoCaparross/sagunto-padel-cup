// Ruta: src/app/(admin)/admin/torneos/[id]/actions.ts

"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const torneoIdSchema = z.string().uuid({
  message: "Identificador de torneo no válido",
});

const clubIdSchema = z.string().uuid({
  message: "Identificador de club no válido",
});

const categoriaIdSchema = z.string().uuid({
  message: "Identificador de categoría no válido",
});

const estadoSchema = z.enum([
  "borrador",
  "publicado",
  "inscripciones_abiertas",
  "en_juego",
  "finalizado",
  "archivado",
]);

const tournamentInfoSchema = z.object({
  precio_texto: z
    .string()
    .trim()
    .max(120, {
      message: "El precio no puede superar los 120 caracteres",
    }),
  descripcion: z
    .string()
    .trim()
    .max(5000, {
      message: "La descripción es demasiado larga",
    }),
});

const categorySchema = z.object({
  torneoId: torneoIdSchema,
  categoriaId: categoriaIdSchema,
  activa: z.boolean(),
  cupoMinimo: z
    .number()
    .int()
    .min(1, {
      message: "El cupo mínimo debe ser al menos 1",
    })
    .max(1000, {
      message: "El cupo mínimo no es válido",
    }),
  cupoMaximo: z
    .number()
    .int()
    .min(1, {
      message: "El cupo máximo debe ser al menos 1",
    })
    .max(1000, {
      message: "El cupo máximo no es válido",
    }),
});

const ALLOWED_TRANSITIONS: Record<
  z.infer<typeof estadoSchema>,
  readonly z.infer<typeof estadoSchema>[]
> = {
  borrador: ["borrador", "publicado"],
  publicado: ["publicado", "borrador", "inscripciones_abiertas"],
  inscripciones_abiertas: [
    "inscripciones_abiertas",
    "en_juego",
  ],
  en_juego: ["en_juego", "finalizado"],
  finalizado: ["finalizado", "archivado"],
  archivado: ["archivado"],
};

type TournamentState = z.infer<typeof estadoSchema>;

async function getTournament(
  torneoId: string
) {
  const admin = createAdminClient();

  return admin
    .from("tournaments")
    .select("id, slug, estado")
    .eq("id", torneoId)
    .maybeSingle();
}

async function revalidateTournament(
  torneoId: string,
  slug?: string | null
) {
  revalidatePath(`/admin/torneos/${torneoId}`);
  revalidatePath("/admin/torneos");
  revalidatePath("/calendario");
  revalidatePath("/");

  if (slug) {
    revalidatePath(`/torneo/${slug}`);
    revalidatePath(`/torneo/${slug}/horarios`);
    revalidatePath(`/torneo/${slug}/grupos`);
    revalidatePath(`/torneo/${slug}/cuadros`);
    revalidatePath(`/torneo/${slug}/resultados`);
  }
}

async function assertTournamentEditable(
  torneoId: string
) {
  const result = await getTournament(torneoId);

  if (result.error) {
    console.error(
      "[admin/torneo] Error comprobando torneo:",
      result.error
    );

    return {
      ok: false as const,
      error: "No se ha podido comprobar el torneo",
    };
  }

  if (!result.data) {
    return {
      ok: false as const,
      error: "El torneo ya no existe",
    };
  }

  const estado = result.data.estado as TournamentState;

  if (
    estado === "en_juego" ||
    estado === "finalizado" ||
    estado === "archivado"
  ) {
    return {
      ok: false as const,
      error:
        "La configuración estructural del torneo está bloqueada en su estado actual",
    };
  }

  return {
    ok: true as const,
    torneo: result.data,
  };
}

export async function updateTournamentEstado(
  torneoId: string,
  estado: string
) {
  await requireAdmin();

  const parsedId = torneoIdSchema.safeParse(torneoId);
  const parsedEstado = estadoSchema.safeParse(estado);

  if (!parsedId.success) {
    return {
      ok: false,
      error: "Identificador de torneo no válido",
    };
  }

  if (!parsedEstado.success) {
    return {
      ok: false,
      error: "Estado de torneo no válido",
    };
  }

  const result = await getTournament(parsedId.data);

  if (result.error) {
    console.error(
      "[admin/torneo] Error consultando estado:",
      result.error
    );

    return {
      ok: false,
      error: "No se ha podido comprobar el torneo",
    };
  }

  if (!result.data) {
    return {
      ok: false,
      error: "El torneo ya no existe",
    };
  }

  const estadoActual = result.data.estado as TournamentState;
  const nuevoEstado = parsedEstado.data;

  if (
    !ALLOWED_TRANSITIONS[estadoActual]?.includes(
      nuevoEstado
    )
  ) {
    return {
      ok: false,
      error:
        `No se puede cambiar el torneo de "${estadoActual}" a "${nuevoEstado}"`,
    };
  }

  if (estadoActual === nuevoEstado) {
    return {
      ok: true,
    };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("tournaments")
    .update({
      estado: nuevoEstado,
    })
    .eq("id", parsedId.data);

  if (error) {
    console.error(
      "[admin/torneo] Error cambiando estado:",
      error
    );

    return {
      ok: false,
      error: "No se ha podido cambiar el estado del torneo",
    };
  }

  await revalidateTournament(
    parsedId.data,
    result.data.slug
  );

  return {
    ok: true,
  };
}

export async function updateTournamentClub(
  torneoId: string,
  clubId: string
) {
  await requireAdmin();

  const parsedTournamentId =
    torneoIdSchema.safeParse(torneoId);

  if (!parsedTournamentId.success) {
    return {
      ok: false,
      error: "Identificador de torneo no válido",
    };
  }

  const editable = await assertTournamentEditable(
    parsedTournamentId.data
  );

  if (!editable.ok) {
    return editable;
  }

  const normalizedClubId = clubId.trim();

  if (normalizedClubId) {
    const parsedClubId =
      clubIdSchema.safeParse(normalizedClubId);

    if (!parsedClubId.success) {
      return {
        ok: false,
        error: "Identificador de club no válido",
      };
    }

    const admin = createAdminClient();

    const { data: club, error: clubError } = await admin
      .from("clubs")
      .select("id")
      .eq("id", parsedClubId.data)
      .maybeSingle();

    if (clubError) {
      console.error(
        "[admin/torneo] Error comprobando club:",
        clubError
      );

      return {
        ok: false,
        error: "No se ha podido comprobar el club",
      };
    }

    if (!club) {
      return {
        ok: false,
        error: "El club seleccionado no existe",
      };
    }
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("tournaments")
    .update({
      club_id: normalizedClubId || null,
    })
    .eq("id", parsedTournamentId.data);

  if (error) {
    console.error(
      "[admin/torneo] Error actualizando club:",
      error
    );

    return {
      ok: false,
      error: "No se ha podido actualizar el club del torneo",
    };
  }

  await revalidateTournament(
    parsedTournamentId.data,
    editable.torneo.slug
  );

  return {
    ok: true,
  };
}

export async function updateTournamentInfo(
  torneoId: string,
  data: {
    precio_texto: string;
    descripcion: string;
  }
) {
  await requireAdmin();

  const parsedTournamentId =
    torneoIdSchema.safeParse(torneoId);

  if (!parsedTournamentId.success) {
    return {
      ok: false,
      error: "Identificador de torneo no válido",
    };
  }

  const editable = await assertTournamentEditable(
    parsedTournamentId.data
  );

  if (!editable.ok) {
    return editable;
  }

  const parsedData = tournamentInfoSchema.safeParse(data);

  if (!parsedData.success) {
    return {
      ok: false,
      error:
        parsedData.error.issues[0]?.message ??
        "La información del torneo no es válida",
    };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("tournaments")
    .update({
      precio_texto:
        parsedData.data.precio_texto || null,
      descripcion:
        parsedData.data.descripcion || null,
    })
    .eq("id", parsedTournamentId.data);

  if (error) {
    console.error(
      "[admin/torneo] Error actualizando información:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido actualizar la información del torneo",
    };
  }

  await revalidateTournament(
    parsedTournamentId.data,
    editable.torneo.slug
  );

  return {
    ok: true,
  };
}

export async function setTournamentCategory(
  torneoId: string,
  categoriaId: string,
  activa: boolean,
  cupoMinimo: number,
  cupoMaximo: number
) {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    torneoId,
    categoriaId,
    activa,
    cupoMinimo,
    cupoMaximo,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "La configuración de categoría no es válida",
    };
  }

  if (
    parsed.data.activa &&
    parsed.data.cupoMinimo > parsed.data.cupoMaximo
  ) {
    return {
      ok: false,
      error:
        "El cupo mínimo no puede ser superior al cupo máximo",
    };
  }

  const editable = await assertTournamentEditable(
    parsed.data.torneoId
  );

  if (!editable.ok) {
    return editable;
  }

  const admin = createAdminClient();

  const { data: categoria, error: categoriaError } =
    await admin
      .from("categories")
      .select("id")
      .eq("id", parsed.data.categoriaId)
      .maybeSingle();

  if (categoriaError) {
    console.error(
      "[admin/torneo] Error comprobando categoría:",
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

  if (!parsed.data.activa) {
    const { error } = await admin
      .from("tournament_categories")
      .delete()
      .eq("tournament_id", parsed.data.torneoId)
      .eq("categoria_id", parsed.data.categoriaId);

    if (error) {
      console.error(
        "[admin/torneo] Error desactivando categoría:",
        error
      );

      return {
        ok: false,
        error:
          "No se ha podido desactivar la categoría del torneo",
      };
    }

    await revalidateTournament(
      parsed.data.torneoId,
      editable.torneo.slug
    );

    return {
      ok: true,
    };
  }

  const { error } = await admin
    .from("tournament_categories")
    .upsert(
      {
        tournament_id: parsed.data.torneoId,
        categoria_id: parsed.data.categoriaId,
        cupo_minimo: parsed.data.cupoMinimo,
        cupo_maximo: parsed.data.cupoMaximo,
      },
      {
        onConflict: "tournament_id,categoria_id",
      }
    );

  if (error) {
    console.error(
      "[admin/torneo] Error guardando categoría:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido guardar la categoría del torneo",
    };
  }

  await revalidateTournament(
    parsed.data.torneoId,
    editable.torneo.slug
  );

  return {
    ok: true,
  };
}