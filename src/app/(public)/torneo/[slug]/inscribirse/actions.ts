// Ruta: src/app/(public)/torneo/[slug]/inscribirse/actions.ts — sustituye entero al archivo actual
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrationSchema } from "@/lib/validations/registration";
import {
  sendRegistrationConfirmedEmail,
  sendPartnerInviteEmail,
} from "@/lib/email/resend";
import { revalidatePath } from "next/cache";

export async function registerPair(
  torneoSlug: string,
  formData: unknown
) {
  const parsed = registrationSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Datos de inscripción no válidos" };
  }
  const data = {
    ...parsed.data,
    compañero_email: (parsed.data.compañero_email ?? "").trim().toLowerCase(),
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Debes iniciar sesión para inscribirte" };
  }

  const admin = createAdminClient();

  const { data: player } = await admin
    .from("players")
    .select("id, nombre, email")
    .eq("auth_user_id", user.id)
    .single();

  if (!player) {
    return { ok: false, error: "No se ha encontrado tu perfil de jugador" };
  }

  const { data: tournament } = await admin
    .from("tournaments")
    .select("id, nombre, estado")
    .eq("slug", torneoSlug)
    .single();

  if (!tournament) {
    return { ok: false, error: "Torneo no encontrado" };
  }

  if (tournament.estado !== "inscripciones_abiertas") {
    return { ok: false, error: "Las inscripciones para este torneo están cerradas" };
  }

  const { data: tournamentCategory, error: categoryError } = await admin
    .from("tournament_categories")
    .select("categoria_id, cupo_maximo")
    .eq("tournament_id", tournament.id)
    .eq("categoria_id", data.categoria_id)
    .maybeSingle();

  if (categoryError || !tournamentCategory) {
    return { ok: false, error: "La categoría seleccionada no está disponible en este torneo" };
  }

  if (data.compañero_email && data.compañero_email === player.email.toLowerCase()) {
    return { ok: false, error: "No puedes inscribirte contigo mismo como pareja" };
  }

  // Compañero: si da su email y ya está registrado, se vincula directamente.
  // Si no existe todavía, la pareja queda "incompleta" y se le invita por email.
  let player2Id: string | null = null;
  if (data.compañero_email) {
    const { data: partner } = await admin
      .from("players")
      .select("id")
      .eq("email", data.compañero_email)
      .maybeSingle();
    player2Id = partner?.id ?? null;
  }

  const playerIds = [player.id, player2Id].filter((id): id is string => Boolean(id));
  const duplicateChecks = await Promise.all(
    playerIds.map((playerId) =>
      admin
        .from("pairs")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", tournament.id)
        .or(`player_1_id.eq.${playerId},player_2_id.eq.${playerId}`)
        .neq("estado", "cancelada")
    )
  );

  if (duplicateChecks.some(({ count, error }) => error || (count ?? 0) > 0)) {
    return { ok: false, error: "Uno de los jugadores ya tiene una inscripción en este torneo" };
  }

  // Cupo: contar parejas confirmadas de esa categoría en ese torneo
  const { count: confirmadas } = await admin
    .from("pairs")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournament.id)
    .eq("categoria_id", data.categoria_id)
    .eq("estado", "confirmada");

  if (confirmadas === null) {
    return { ok: false, error: "No se ha podido comprobar la disponibilidad" };
  }

  const cupoMaximo = tournamentCategory.cupo_maximo ?? 12;
  const hayHueco = (confirmadas ?? 0) < cupoMaximo;
  const estadoPareja = data.compañero_email
    ? player2Id
      ? "confirmada"
      : "incompleta"
    : "incompleta";
  const estadoFinal = !hayHueco ? "lista_espera" : estadoPareja;

  const { data: pair, error: pairError } = await admin
    .from("pairs")
    .insert({
      tournament_id: tournament.id,
      categoria_id: data.categoria_id,
      player_1_id: player.id,
      player_2_id: player2Id,
      estado: estadoFinal,
    })
    .select("id")
    .single();

  if (pairError || !pair) {
    return { ok: false, error: "No se ha podido crear la pareja" };
  }

  const { error: regError } = await admin.from("registrations").insert({
    pair_id: pair.id,
    tournament_id: tournament.id,
    estado: estadoFinal === "lista_espera" ? "lista_espera" : "confirmada",
    talla_camiseta: data.talla_camiseta,
  });

  if (regError) {
    await admin.from("pairs").delete().eq("id", pair.id);
    return { ok: false, error: "No se ha podido registrar la inscripción" };
  }

  if (data.quiere_bolsa_pareja && !player2Id) {
    await admin.from("partner_pool").insert({
      player_id: player.id,
      tournament_id: tournament.id,
      categoria_id: data.categoria_id,
      disponible: true,
    });
  }

  try {
    await sendRegistrationConfirmedEmail({
      to: player.email,
      nombre: player.nombre,
      torneoNombre: tournament.nombre,
      estado: estadoFinal === "lista_espera" ? "lista_espera" : "confirmada",
    });
  } catch {
    // La inscripción ya se ha confirmado; el envío se puede recuperar desde el panel de correo.
  }

  // Compañero invitado que aún no tiene cuenta: email automático de invitación
  if (data.compañero_email && !player2Id) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    try {
      await sendPartnerInviteEmail({
        to: data.compañero_email,
        invitadoPorNombre: player.nombre,
        torneoNombre: tournament.nombre,
        signupUrl: `${siteUrl}/registro`,
      });
    } catch {
      // La pareja queda registrada como incompleta aunque el proveedor de correo falle.
    }
  }

  revalidatePath(`/torneo/${torneoSlug}`);
  revalidatePath(`/torneo/${torneoSlug}/inscribirse`);
  revalidatePath("/app");
  revalidatePath("/app/torneos");
  return { ok: true, estado: estadoFinal };
}
