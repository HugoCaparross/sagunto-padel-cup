// Ruta: src/app/(public)/torneo/[slug]/quiniela/actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function votar(
  slug: string,
  matchId: string,
  parejaId: string
) {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error:
        "Debes iniciar sesión para votar",
    };
  }

  const {
    data: player,
  } =
    await supabase
      .from("players")
      .select("id")
      .eq(
        "auth_user_id",
        user.id
      )
      .maybeSingle();

  if (!player) {
    return {
      ok: false,
      error:
        "Perfil no encontrado",
    };
  }

  /*
   * Comprobamos en servidor que el partido existe,
   * pertenece al torneo solicitado y que la pareja
   * elegida forma parte realmente del cruce.
   */
  const {
    data: partido,
    error: partidoError,
  } = await supabase
    .from("matches")
    .select(
      "id, pair_1_id, pair_2_id, estado, tournaments!inner(slug)"
    )
    .eq(
      "id",
      matchId
    )
    .eq(
      "tournaments.slug",
      slug
    )
    .maybeSingle();

  if (partidoError) {
    console.error(
      "[votar] Error comprobando partido:",
      partidoError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar el partido",
    };
  }

  if (!partido) {
    return {
      ok: false,
      error:
        "Partido no encontrado",
    };
  }

  if (
    partido.estado !==
    "pendiente"
  ) {
    return {
      ok: false,
      error:
        "Este partido ya no admite pronósticos",
    };
  }

  const parejaValida =
    partido.pair_1_id ===
      parejaId ||
    partido.pair_2_id ===
      parejaId;

  if (!parejaValida) {
    return {
      ok: false,
      error:
        "La pareja seleccionada no pertenece a este partido",
    };
  }

  const {
    error,
  } = await supabase
    .from("predicciones")
    .upsert(
      {
        match_id:
          matchId,
        player_id:
          player.id,
        pareja_predicha_id:
          parejaId,
      },
      {
        onConflict:
          "match_id,player_id",
      }
    );

  if (error) {
    console.error(
      "[votar] Error guardando predicción:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido guardar tu voto",
    };
  }

  revalidatePath(
    `/torneo/${slug}/quiniela`
  );

  return {
    ok: true,
  };
}