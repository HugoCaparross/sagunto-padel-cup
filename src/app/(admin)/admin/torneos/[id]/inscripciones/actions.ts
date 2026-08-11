// Ruta: src/app/(admin)/admin/torneos/[id]/inscripciones/actions.ts
"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWaitlistPromotedEmail } from "@/lib/email/resend";
import { revalidatePath } from "next/cache";

const uuidSchema = z.string().uuid();

const pairStateSchema = z.enum([
  "confirmada",
  "lista_espera",
  "incompleta",
  "cancelada",
]);

const updatePairSchema = z.object({
  torneoId: uuidSchema,
  pairId: uuidSchema,
  estado: pairStateSchema,
});

const checkInSchema = z.object({
  torneoId: uuidSchema,
  registrationId: uuidSchema,
  checkedIn: z.boolean(),
});

export async function updatePairEstado(
  torneoId: string,
  pairId: string,
  estado: string
) {
  await requireAdmin();

  const parsed = updatePairSchema.safeParse({
    torneoId,
    pairId,
    estado,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Estado de inscripción no válido",
    };
  }

  const admin = createAdminClient();

  const { data: pair, error: pairError } =
    await admin
      .from("pairs")
      .select(
        "id, estado, tournament_id, player_1_id, player_2_id"
      )
      .eq("id", parsed.data.pairId)
      .eq(
        "tournament_id",
        parsed.data.torneoId
      )
      .maybeSingle();

  if (pairError) {
    console.error(
      "[admin/inscripciones] Error consultando pareja:",
      pairError
    );

    return {
      ok: false,
      error: "No se ha podido comprobar la pareja",
    };
  }

  if (!pair) {
    return {
      ok: false,
      error:
        "La pareja no existe o no pertenece a este torneo",
    };
  }

  const estadoAnterior = pair.estado;

  if (estadoAnterior === parsed.data.estado) {
    return {
      ok: true,
    };
  }

  const { error: pairUpdateError } =
    await admin
      .from("pairs")
      .update({
        estado: parsed.data.estado,
      })
      .eq("id", parsed.data.pairId)
      .eq(
        "tournament_id",
        parsed.data.torneoId
      );

  if (pairUpdateError) {
    console.error(
      "[admin/inscripciones] Error actualizando pareja:",
      pairUpdateError
    );

    return {
      ok: false,
      error:
        "No se ha podido actualizar el estado de la pareja",
    };
  }

  const registrationState =
    parsed.data.estado === "lista_espera"
      ? "lista_espera"
      : parsed.data.estado === "confirmada"
        ? "confirmada"
        : parsed.data.estado === "incompleta"
          ? "incompleta"
          : "cancelada";

  const { error: registrationError } =
    await admin
      .from("registrations")
      .update({
        estado: registrationState,
      })
      .eq("pair_id", parsed.data.pairId)
      .eq(
        "tournament_id",
        parsed.data.torneoId
      );

  if (registrationError) {
    console.error(
      "[admin/inscripciones] Error actualizando inscripción:",
      registrationError
    );

    return {
      ok: false,
      error:
        "La pareja se ha actualizado, pero no se ha podido actualizar la inscripción",
    };
  }

  const fuePromocion =
    estadoAnterior === "lista_espera" &&
    parsed.data.estado === "confirmada";

  if (fuePromocion) {
    const [
      { data: torneo },
      { data: jugadores },
    ] = await Promise.all([
      admin
        .from("tournaments")
        .select("nombre")
        .eq("id", parsed.data.torneoId)
        .maybeSingle(),

      admin
        .from("players")
        .select("id, nombre, email")
        .in("id", [
          pair.player_1_id,
          ...(pair.player_2_id
            ? [pair.player_2_id]
            : []),
        ]),
    ]);

    if (torneo && jugadores?.length) {
      for (const jugador of jugadores) {
        if (!jugador.email) {
          continue;
        }

        try {
          await sendWaitlistPromotedEmail({
            to: jugador.email,
            nombre: jugador.nombre,
            torneoNombre: torneo.nombre,
          });
        } catch (emailError) {
          console.error(
            "[admin/inscripciones] Error enviando promoción de lista de espera:",
            emailError
          );
        }
      }
    }
  }

  revalidatePath(
    `/admin/torneos/${parsed.data.torneoId}/inscripciones`
  );

  return {
    ok: true,
  };
}

export async function toggleCheckIn(
  torneoId: string,
  registrationId: string,
  checkedIn: boolean
) {
  await requireAdmin();

  const parsed = checkInSchema.safeParse({
    torneoId,
    registrationId,
    checkedIn,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Datos de check-in no válidos",
    };
  }

  const admin = createAdminClient();

  const { data: registro, error: registroError } =
    await admin
      .from("registrations")
      .select(
        "id, pair_id, tournament_id"
      )
      .eq("id", parsed.data.registrationId)
      .eq(
        "tournament_id",
        parsed.data.torneoId
      )
      .maybeSingle();

  if (registroError) {
    console.error(
      "[admin/inscripciones] Error consultando registro:",
      registroError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar la inscripción",
    };
  }

  if (!registro) {
    return {
      ok: false,
      error:
        "La inscripción no existe o no pertenece a este torneo",
    };
  }

  const { error: updateError } =
    await admin
      .from("registrations")
      .update({
        checked_in: parsed.data.checkedIn,
        checked_in_at: parsed.data.checkedIn
          ? new Date().toISOString()
          : null,
      })
      .eq(
        "id",
        parsed.data.registrationId
      )
      .eq(
        "tournament_id",
        parsed.data.torneoId
      );

  if (updateError) {
    console.error(
      "[admin/inscripciones] Error actualizando check-in:",
      updateError
    );

    return {
      ok: false,
      error:
        "No se ha podido actualizar el check-in",
    };
  }

  revalidatePath(
    `/admin/torneos/${parsed.data.torneoId}/inscripciones`
  );

  return {
    ok: true,
  };
}