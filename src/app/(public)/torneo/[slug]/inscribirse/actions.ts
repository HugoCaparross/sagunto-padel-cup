// Ruta: src/app/(public)/torneo/[slug]/inscribirse/actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrationSchema } from "@/lib/validations/registration";
import {
  sendRegistrationConfirmedEmail,
  sendPartnerInviteEmail,
} from "@/lib/email/resend";

export async function registerPair(
  torneoSlug: string,
  formData: unknown
) {
  const parsed =
    registrationSchema.safeParse(
      formData
    );

  if (!parsed.success) {
    return {
      ok: false,
      error:
        "Datos de inscripción no válidos",
    };
  }

  const data = parsed.data;

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
        "Debes iniciar sesión para inscribirte",
    };
  }

  const admin =
    createAdminClient();

  const {
    data: player,
    error: playerError,
  } = await admin
    .from("players")
    .select(
      "id, nombre, email"
    )
    .eq(
      "auth_user_id",
      user.id
    )
    .maybeSingle();

  if (playerError) {
    console.error(
      "[registerPair] Error obteniendo jugador:",
      playerError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar tu perfil de jugador",
    };
  }

  if (!player) {
    return {
      ok: false,
      error:
        "No se ha encontrado tu perfil de jugador",
    };
  }

  const {
    data: tournament,
    error: tournamentError,
  } =
    await admin
      .from("tournaments")
      .select(
        "id, nombre"
      )
      .eq(
        "slug",
        torneoSlug
      )
      .maybeSingle();

  if (tournamentError) {
    console.error(
      "[registerPair] Error obteniendo torneo:",
      tournamentError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar el torneo",
    };
  }

  if (!tournament) {
    return {
      ok: false,
      error:
        "Torneo no encontrado",
    };
  }

  /*
   * Si el usuario ha introducido email de compañero,
   * buscamos si ya existe como jugador.
   *
   * El email se normaliza antes de consultar para evitar
   * diferencias accidentales de mayúsculas/minúsculas.
   */
  const compañeroEmail =
    data.compañero_email
      ?.trim()
      .toLowerCase() || null;

  let player2Id:
    | string
    | null = null;

  if (compañeroEmail) {
    const {
      data: partner,
      error: partnerError,
    } = await admin
      .from("players")
      .select("id")
      .ilike(
        "email",
        compañeroEmail
      )
      .maybeSingle();

    if (partnerError) {
      console.error(
        "[registerPair] Error buscando compañero:",
        partnerError
      );

      return {
        ok: false,
        error:
          "No se ha podido comprobar el compañero indicado",
      };
    }

    player2Id =
      partner?.id ?? null;

    /*
     * No permitimos que un jugador se registre
     * como su propio compañero.
     */
    if (
      player2Id === player.id
    ) {
      return {
        ok: false,
        error:
          "No puedes seleccionarte a ti mismo como compañero",
      };
    }
  }

  /*
   * Inserción atómica:
   * la función de BD controla el cupo dentro de una
   * única operación para evitar que dos peticiones
   * simultáneas ocupen la misma última plaza.
   */
  const {
    data: resultado,
    error,
  } = await admin.rpc(
    "registrar_pareja",
    {
      p_tournament_id:
        tournament.id,
      p_categoria_id:
        data.categoria_id,
      p_player_1_id:
        player.id,
      p_player_2_id:
        player2Id,
      p_talla_camiseta:
        data.talla_camiseta,
    }
  );

  if (error) {
    console.error(
      "[registerPair] Error en registrar_pareja:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido completar la inscripción",
    };
  }

  const registro =
    Array.isArray(resultado)
      ? resultado[0]
      : resultado;

  if (!registro) {
    console.error(
      "[registerPair] registrar_pareja no devolvió resultado"
    );

    return {
      ok: false,
      error:
        "No se ha podido confirmar el resultado de la inscripción",
    };
  }

  const estadoFinal =
    typeof registro.estado_final ===
    "string"
      ? registro.estado_final
      : null;

  if (!estadoFinal) {
    console.error(
      "[registerPair] registrar_pareja no devolvió estado_final:",
      registro
    );

    return {
      ok: false,
      error:
        "No se ha podido confirmar el estado de la inscripción",
    };
  }

  /*
   * La bolsa de pareja es una operación secundaria.
   *
   * Si falla, no debemos convertir una inscripción
   * ya confirmada en una falsa inscripción fallida.
   */
  if (
    data.quiere_bolsa_pareja &&
    !player2Id
  ) {
    const {
      error: poolError,
    } = await admin
      .from("partner_pool")
      .insert({
        player_id:
          player.id,
        tournament_id:
          tournament.id,
        categoria_id:
          data.categoria_id,
        disponible: true,
      });

    if (poolError) {
      console.error(
        "[registerPair] Error añadiendo jugador a bolsa de parejas:",
        poolError
      );
    }
  }

  /*
   * Los emails son comunicación secundaria.
   * La inscripción ya está persistida en BD.
   */
  try {
    await sendRegistrationConfirmedEmail(
      {
        to: player.email,
        nombre:
          player.nombre,
        torneoNombre:
          tournament.nombre,
        estado:
          estadoFinal ===
          "lista_espera"
            ? "lista_espera"
            : "confirmada",
      }
    );
  } catch (emailError) {
    console.error(
      "[registerPair] Error enviando email de inscripción:",
      emailError
    );
  }

  if (
    compañeroEmail &&
    !player2Id
  ) {
    const siteUrl =
      process.env
        .NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    try {
      await sendPartnerInviteEmail(
        {
          to: compañeroEmail,
          invitadoPorNombre:
            player.nombre,
          torneoNombre:
            tournament.nombre,
          signupUrl:
            `${siteUrl}/registro`,
        }
      );
    } catch (emailError) {
      console.error(
        "[registerPair] Error enviando invitación al compañero:",
        emailError
      );
    }
  }

  return {
    ok: true,
    estado: estadoFinal,
  };
}