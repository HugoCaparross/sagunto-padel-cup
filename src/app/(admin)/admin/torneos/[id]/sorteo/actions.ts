// Ruta: src/app/(admin)/admin/torneos/[id]/sorteo/actions.ts

"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateGroups,
  roundRobin,
} from "@/lib/sorteo";
import { revalidatePath } from "next/cache";

const uuidSchema = z.string().uuid({
  message: "Identificador no válido",
});

const LETRAS = "ABCDEFGHIJKLMNOP".split("");

const DURACION_GRUPOS_MIN = 40;

const sorteoSchema = z.object({
  torneoId: uuidSchema,
  categoriaId: uuidSchema,
});

export async function generarSorteo(
  torneoId: string,
  categoriaId: string
) {
  await requireAdmin();

  const parsed = sorteoSchema.safeParse({
    torneoId,
    categoriaId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Los identificadores no son válidos",
    };
  }

  const admin = createAdminClient();

  const { data: torneo, error: torneoError } =
    await admin
      .from("tournaments")
      .select(
        "id, slug, club_id, fecha_inicio, estado"
      )
      .eq("id", parsed.data.torneoId)
      .maybeSingle();

  if (torneoError) {
    console.error(
      "[admin/sorteo] Error comprobando torneo:",
      torneoError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar el torneo",
    };
  }

  if (!torneo) {
    return {
      ok: false,
      error: "El torneo no existe",
    };
  }

  if (
    torneo.estado === "en_juego" ||
    torneo.estado === "finalizado" ||
    torneo.estado === "archivado"
  ) {
    return {
      ok: false,
      error:
        "No se puede generar un sorteo cuando el torneo ya está en juego o cerrado",
    };
  }

  const {
    data: categoriaTorneo,
    error: categoriaTorneoError,
  } = await admin
    .from("tournament_categories")
    .select("categoria_id")
    .eq(
      "tournament_id",
      parsed.data.torneoId
    )
    .eq(
      "categoria_id",
      parsed.data.categoriaId
    )
    .maybeSingle();

  if (categoriaTorneoError) {
    console.error(
      "[admin/sorteo] Error comprobando categoría del torneo:",
      categoriaTorneoError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar la categoría",
    };
  }

  if (!categoriaTorneo) {
    return {
      ok: false,
      error:
        "La categoría no está configurada para este torneo",
    };
  }

  const { data: gruposExistentes, error: gruposError } =
    await admin
      .from("groups")
      .select("id")
      .eq(
        "tournament_id",
        parsed.data.torneoId
      )
      .eq(
        "categoria_id",
        parsed.data.categoriaId
      );

  if (gruposError) {
    console.error(
      "[admin/sorteo] Error comprobando sorteos existentes:",
      gruposError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar si ya existe un sorteo",
    };
  }

  if (gruposExistentes?.length) {
    return {
      ok: false,
      error:
        "Esta categoría ya tiene un sorteo generado. No se puede regenerar automáticamente sobre la estructura existente.",
    };
  }

  const { data: pairs, error: pairsError } =
    await admin
      .from("pairs")
      .select("id, cabeza_de_serie")
      .eq(
        "tournament_id",
        parsed.data.torneoId
      )
      .eq(
        "categoria_id",
        parsed.data.categoriaId
      )
      .eq("estado", "confirmada");

  if (pairsError) {
    console.error(
      "[admin/sorteo] Error cargando parejas:",
      pairsError
    );

    return {
      ok: false,
      error:
        "No se han podido cargar las parejas confirmadas",
    };
  }

  if (!pairs || pairs.length < 3) {
    return {
      ok: false,
      error:
        "Hacen falta al menos 3 parejas confirmadas",
    };
  }

  const fechaInicio =
    torneo.fecha_inicio ??
    new Date().toISOString().slice(0, 10);

  let numPistas = 4;

  if (torneo.club_id) {
    const { data: club, error: clubError } =
      await admin
        .from("clubs")
        .select("num_pistas")
        .eq("id", torneo.club_id)
        .maybeSingle();

    if (clubError) {
      console.error(
        "[admin/sorteo] Error cargando club:",
        clubError
      );

      return {
        ok: false,
        error:
          "No se ha podido comprobar el número de pistas",
      };
    }

    numPistas = club?.num_pistas ?? 4;
  }

  if (numPistas < 1) {
    return {
      ok: false,
      error:
        "El torneo no tiene pistas configuradas correctamente",
    };
  }

  const inicioBase = new Date(
    `${fechaInicio}T09:00:00`
  );

  if (Number.isNaN(inicioBase.getTime())) {
    return {
      ok: false,
      error:
        "La fecha de inicio del torneo no es válida",
    };
  }

  const siguienteHuecoPorPista =
    Array.from(
      { length: numPistas },
      () => new Date(inicioBase)
    );

  const grupos = generateGroups(pairs);

  if (!grupos.length) {
    return {
      ok: false,
      error:
        "No se han podido construir los grupos",
    };
  }

  let contadorPista = 0;

  for (
    let i = 0;
    i < grupos.length;
    i += 1
  ) {
    const parejasGrupo = grupos[i];

    if (!parejasGrupo?.length) {
      continue;
    }

    const { data: grupo, error: grupoError } =
      await admin
        .from("groups")
        .insert({
          tournament_id:
            parsed.data.torneoId,
          categoria_id:
            parsed.data.categoriaId,
          nombre: `Grupo ${LETRAS[i] ?? `G${i + 1}`}`,
        })
        .select("id")
        .single();

    if (grupoError || !grupo) {
      console.error(
        "[admin/sorteo] Error creando grupo:",
        grupoError
      );

      return {
        ok: false,
        error:
          "No se ha podido completar la generación del sorteo",
      };
    }

    const standingsPayload =
      parejasGrupo.map((pairId) => ({
        group_id: grupo.id,
        pair_id: pairId,
      }));

    const {
      error: standingsError,
    } = await admin
      .from("group_standings")
      .insert(standingsPayload);

    if (standingsError) {
      console.error(
        "[admin/sorteo] Error creando clasificación inicial:",
        standingsError
      );

      return {
        ok: false,
        error:
          "No se ha podido crear la clasificación inicial del grupo",
      };
    }

    const partidos = roundRobin(
      parejasGrupo
    );

    for (const [pair1, pair2] of partidos) {
      const pistaIndex =
        contadorPista % numPistas;

      const pista =
        `Pista ${pistaIndex + 1}`;

      const hueco =
        siguienteHuecoPorPista[pistaIndex];

      if (!hueco) {
        return {
          ok: false,
          error:
            "No se ha podido calcular el horario de uno de los partidos",
        };
      }

      const horaProgramada =
        new Date(hueco);

      siguienteHuecoPorPista[
        pistaIndex
      ] = new Date(
        horaProgramada.getTime() +
          DURACION_GRUPOS_MIN * 60_000
      );

      contadorPista += 1;

      const {
        error: matchError,
      } = await admin
        .from("matches")
        .insert({
          tournament_id:
            parsed.data.torneoId,
          categoria_id:
            parsed.data.categoriaId,
          fase: "grupos",
          group_id: grupo.id,
          pair_1_id: pair1,
          pair_2_id: pair2,
          pista,
          hora_programada:
            horaProgramada.toISOString(),
          estado: "pendiente",
        });

      if (matchError) {
        console.error(
          "[admin/sorteo] Error creando partido:",
          matchError
        );

        return {
          ok: false,
          error:
            "No se ha podido completar la generación de los partidos de grupo",
        };
      }
    }
  }

  revalidatePath(
    `/admin/torneos/${parsed.data.torneoId}/sorteo`
  );

  revalidatePath(
    `/admin/torneos/${parsed.data.torneoId}/resultados`
  );

  revalidatePath(
    `/admin/torneos/${parsed.data.torneoId}/horarios`
  );

  revalidatePath(
    `/admin/torneos/${parsed.data.torneoId}/cuadros`
  );

  if (torneo.slug) {
    revalidatePath(
      `/torneo/${torneo.slug}/horarios`
    );

    revalidatePath(
      `/torneo/${torneo.slug}/grupos`
    );
  }

  return {
    ok: true,
  };
}