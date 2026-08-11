// Ruta: src/app/(admin)/admin/torneos/[id]/horarios/actions.ts
"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const uuidSchema = z.string().uuid();

const horarioSchema = z.object({
  torneoId: uuidSchema,
  matchId: uuidSchema,
  pista: z
    .string()
    .trim()
    .min(1, {
      message: "La pista es obligatoria",
    })
    .max(50, {
      message: "El nombre de la pista es demasiado largo",
    }),
  horaProgramada: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        !Number.isNaN(
          new Date(value).getTime()
        ),
      {
        message: "La fecha y hora no son válidas",
      }
    ),
});

export async function actualizarHorario(
  torneoId: string,
  matchId: string,
  pista: string,
  horaProgramada: string
) {
  await requireAdmin();

  const parsed = horarioSchema.safeParse({
    torneoId,
    matchId,
    pista,
    horaProgramada,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Los datos del horario no son válidos",
    };
  }

  const admin = createAdminClient();

  const { data: torneo, error: torneoError } =
    await admin
      .from("tournaments")
      .select("id, slug, estado")
      .eq("id", parsed.data.torneoId)
      .maybeSingle();

  if (torneoError) {
    console.error(
      "[admin/horarios] Error comprobando torneo:",
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

  if (torneo.estado === "finalizado" || torneo.estado === "archivado") {
    return {
      ok: false,
      error:
        "No se pueden modificar horarios de un torneo cerrado",
    };
  }

  const { data: partido, error: partidoError } =
    await admin
      .from("matches")
      .select(
        "id, tournament_id, estado, pista, hora_programada"
      )
      .eq("id", parsed.data.matchId)
      .eq(
        "tournament_id",
        parsed.data.torneoId
      )
      .maybeSingle();

  if (partidoError) {
    console.error(
      "[admin/horarios] Error comprobando partido:",
      partidoError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar el partido",
    };
  }

  if (!partido) {
    return {
      ok: false,
      error:
        "El partido no existe o no pertenece a este torneo",
    };
  }

  const horaISO = parsed.data.horaProgramada
    ? new Date(
        parsed.data.horaProgramada
      ).toISOString()
    : null;

  if (horaISO) {
    const { data: conflicto, error: conflictoError } =
      await admin
        .from("matches")
        .select("id")
        .eq(
          "tournament_id",
          parsed.data.torneoId
        )
        .eq("pista", parsed.data.pista)
        .eq("hora_programada", horaISO)
        .neq("id", parsed.data.matchId)
        .limit(1)
        .maybeSingle();

    if (conflictoError) {
      console.error(
        "[admin/horarios] Error comprobando conflicto:",
        conflictoError
      );

      return {
        ok: false,
        error:
          "No se ha podido comprobar si existe un conflicto de pista",
      };
    }

    if (conflicto) {
      return {
        ok: false,
        error:
          "Ya existe otro partido programado en esa pista y hora",
      };
    }
  }

  const { error: updateError } = await admin
    .from("matches")
    .update({
      pista: parsed.data.pista,
      hora_programada: horaISO,
    })
    .eq("id", parsed.data.matchId)
    .eq(
      "tournament_id",
      parsed.data.torneoId
    );

  if (updateError) {
    console.error(
      "[admin/horarios] Error actualizando horario:",
      updateError
    );

    return {
      ok: false,
      error:
        "No se ha podido actualizar el horario",
    };
  }

  revalidatePath(
    `/admin/torneos/${parsed.data.torneoId}/horarios`
  );

  if (torneo.slug) {
    revalidatePath(
      `/torneo/${torneo.slug}/horarios`
    );
  }

  return {
    ok: true,
  };
}