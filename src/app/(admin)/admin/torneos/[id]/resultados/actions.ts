// Ruta: src/app/(admin)/admin/torneos/[id]/resultados/actions.ts

"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { resultadoSchema } from "@/lib/validations/resultado";
import { advanceWinner } from "@/lib/advance";
import { intentarCalcularRanking } from "@/lib/ranking";
import { revalidatePath } from "next/cache";

const uuidSchema = z.string().uuid({
  message: "Identificador no válido",
});

const resultadoRequestSchema = z.object({
  torneoId: uuidSchema,
  matchId: uuidSchema,
});

function calcularMarcador(
  sets: {
    juegos_pair1: number;
    juegos_pair2: number;
    tiebreak: boolean;
    tiebreak_pair1?: number;
    tiebreak_pair2?: number;
  }[]
) {
  let setsPair1 = 0;
  let setsPair2 = 0;
  let juegosPair1 = 0;
  let juegosPair2 = 0;

  for (const set of sets) {
    juegosPair1 += set.juegos_pair1;
    juegosPair2 += set.juegos_pair2;

    if (set.juegos_pair1 > set.juegos_pair2) {
      setsPair1 += 1;
      continue;
    }

    if (set.juegos_pair2 > set.juegos_pair1) {
      setsPair2 += 1;
      continue;
    }

    if (
      set.tiebreak &&
      set.tiebreak_pair1 !== undefined &&
      set.tiebreak_pair2 !== undefined
    ) {
      if (
        set.tiebreak_pair1 >
        set.tiebreak_pair2
      ) {
        setsPair1 += 1;
      } else if (
        set.tiebreak_pair2 >
        set.tiebreak_pair1
      ) {
        setsPair2 += 1;
      }
    }
  }

  return {
    setsPair1,
    setsPair2,
    juegosPair1,
    juegosPair2,
  };
}

export async function guardarResultado(
  torneoId: string,
  matchId: string,
  formData: unknown
) {
  const adminUser = await requireAdmin();

  const parsedRequest =
    resultadoRequestSchema.safeParse({
      torneoId,
      matchId,
    });

  if (!parsedRequest.success) {
    return {
      ok: false,
      error:
        parsedRequest.error.issues[0]?.message ??
        "Identificadores no válidos",
    };
  }

  const parsedResult =
    resultadoSchema.safeParse(formData);

  if (!parsedResult.success) {
    return {
      ok: false,
      error:
        parsedResult.error.issues[0]?.message ??
        "Marcador no válido",
    };
  }

  const {
    setsPair1,
    setsPair2,
    juegosPair1,
    juegosPair2,
  } = calcularMarcador(parsedResult.data.sets);

  if (setsPair1 === setsPair2) {
    return {
      ok: false,
      error:
        "El resultado debe determinar un ganador",
    };
  }

  const admin = createAdminClient();

  const { data: torneo, error: torneoError } =
    await admin
      .from("tournaments")
      .select("id, slug")
      .eq("id", parsedRequest.data.torneoId)
      .maybeSingle();

  if (torneoError) {
    console.error(
      "[admin/resultados] Error comprobando torneo:",
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

  const { data: match, error: matchError } =
    await admin
      .from("matches")
      .select(
        "id, tournament_id, group_id, tramo, categoria_id, pair_1_id, pair_2_id, estado, resultado_json, siguiente_match_id"
      )
      .eq("id", parsedRequest.data.matchId)
      .eq(
        "tournament_id",
        parsedRequest.data.torneoId
      )
      .maybeSingle();

  if (matchError) {
    console.error(
      "[admin/resultados] Error consultando partido:",
      matchError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar el partido",
    };
  }

  if (!match) {
    return {
      ok: false,
      error:
        "El partido no existe o no pertenece a este torneo",
    };
  }

  if (match.estado === "finalizado") {
    return {
      ok: false,
      error:
        "Este partido ya tiene un resultado registrado",
    };
  }

  if (
    match.estado === "cancelado" ||
    match.estado === "walkover" ||
    match.estado === "retirada"
  ) {
    return {
      ok: false,
      error:
        "No se puede introducir un marcador convencional para este partido",
    };
  }

  if (!match.pair_1_id || !match.pair_2_id) {
    return {
      ok: false,
      error:
        "El partido todavía no tiene las dos parejas asignadas",
    };
  }

  const ganadorId =
    setsPair1 > setsPair2
      ? match.pair_1_id
      : match.pair_2_id;

  const { data: adminPlayer } =
    await admin
      .from("players")
      .select("id")
      .eq(
        "auth_user_id",
        adminUser.id
      )
      .maybeSingle();

  const resultadoJson = {
    sets: parsedResult.data.sets,
    ganador_id: ganadorId,
    sets_pair1: setsPair1,
    sets_pair2: setsPair2,
    juegos_pair1: juegosPair1,
    juegos_pair2: juegosPair2,
  };

  const { error: updateError } =
    await admin
      .from("matches")
      .update({
        estado: "finalizado",
        resultado_json: resultadoJson,
        introducido_por:
          adminPlayer?.id ?? null,
        fecha_modificacion:
          new Date().toISOString(),
        hora_fin:
          new Date().toISOString(),
      })
      .eq(
        "id",
        parsedRequest.data.matchId
      )
      .eq(
        "tournament_id",
        parsedRequest.data.torneoId
      );

  if (updateError) {
    console.error(
      "[admin/resultados] Error guardando resultado:",
      updateError
    );

    return {
      ok: false,
      error:
        "No se ha podido guardar el resultado",
    };
  }

  const { error: auditError } =
    await admin.from("audit_log").insert({
      entidad: "matches",
      entidad_id:
        parsedRequest.data.matchId,
      accion: "resultado_guardado",
      valores_anteriores_json: {
        resultado_json:
          match.resultado_json,
        estado: match.estado,
      },
      valores_nuevos_json: {
        resultado_json: resultadoJson,
        estado: "finalizado",
      },
      fecha: new Date().toISOString(),
    });

  if (auditError) {
    console.error(
      "[admin/resultados] Error registrando auditoría:",
      auditError
    );
  }

  if (match.group_id) {
    const pairIds = [
      match.pair_1_id,
      match.pair_2_id,
    ];

    for (const pairId of pairIds) {
      if (!pairId) {
        continue;
      }

      const esPair1 =
        pairId === match.pair_1_id;

      const propios = esPair1
        ? {
            sets: setsPair1,
            juegos: juegosPair1,
          }
        : {
            sets: setsPair2,
            juegos: juegosPair2,
          };

      const rivales = esPair1
        ? {
            sets: setsPair2,
            juegos: juegosPair2,
          }
        : {
            sets: setsPair1,
            juegos: juegosPair1,
          };

      const esGanador =
        pairId === ganadorId;

      const {
        data: standing,
        error: standingError,
      } = await admin
        .from("group_standings")
        .select(
          "id, partidos_jugados, victorias, derrotas, sets_favor, sets_contra, juegos_favor, juegos_contra, puntos"
        )
        .eq("group_id", match.group_id)
        .eq("pair_id", pairId)
        .maybeSingle();

      if (standingError) {
        console.error(
          "[admin/resultados] Error consultando clasificación:",
          standingError
        );

        return {
          ok: false,
          error:
            "El resultado se ha guardado, pero no se ha podido actualizar la clasificación",
        };
      }

      if (!standing) {
        continue;
      }

      const {
        error: standingUpdateError,
      } = await admin
        .from("group_standings")
        .update({
          partidos_jugados:
            standing.partidos_jugados + 1,
          victorias:
            standing.victorias +
            (esGanador ? 1 : 0),
          derrotas:
            standing.derrotas +
            (esGanador ? 0 : 1),
          sets_favor:
            standing.sets_favor +
            propios.sets,
          sets_contra:
            standing.sets_contra +
            rivales.sets,
          juegos_favor:
            standing.juegos_favor +
            propios.juegos,
          juegos_contra:
            standing.juegos_contra +
            rivales.juegos,
          puntos:
            standing.puntos +
            (esGanador ? 3 : 0),
        })
        .eq("id", standing.id);

      if (standingUpdateError) {
        console.error(
          "[admin/resultados] Error actualizando clasificación:",
          standingUpdateError
        );

        return {
          ok: false,
          error:
            "El resultado se ha guardado, pero no se ha podido completar la actualización de la clasificación",
        };
      }
    }
  }

  if (
    match.tramo &&
    ganadorId
  ) {
    await advanceWinner(
      admin,
      parsedRequest.data.matchId,
      ganadorId
    );

    if (!match.siguiente_match_id) {
      await intentarCalcularRanking(
        admin,
        parsedRequest.data.torneoId,
        match.categoria_id
      );
    }
  }

  revalidatePath(
    `/admin/torneos/${parsedRequest.data.torneoId}/resultados`
  );

  revalidatePath(
    `/admin/torneos/${parsedRequest.data.torneoId}/sorteo`
  );

  revalidatePath(
    `/admin/torneos/${parsedRequest.data.torneoId}/cuadros`
  );

  revalidatePath(
    `/admin/torneos/${parsedRequest.data.torneoId}/horarios`
  );

  if (torneo.slug) {
    revalidatePath(
      `/torneo/${torneo.slug}/resultados`
    );

    revalidatePath(
      `/torneo/${torneo.slug}/cuadros`
    );

    revalidatePath(
      `/torneo/${torneo.slug}/grupos`
    );

    revalidatePath(
      `/torneo/${torneo.slug}/horarios`
    );

    revalidatePath(
      `/ranking`
    );
  }

  return {
    ok: true,
  };
}