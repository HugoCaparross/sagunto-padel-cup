// Ruta: src/app/(public)/torneo/[slug]/inscribirse/actions.ts — sustituye entero al archivo actual
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrationSchema } from "@/lib/validations/registration";
import {
  sendRegistrationConfirmedEmail,
  sendPartnerInviteEmail,
} from "@/lib/email/resend";

export async function registerPair(torneoSlug: string, formData: unknown) {
  const parsed = registrationSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Datos de inscripción no válidos" };
  }
  const data = parsed.data;

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
    .select("id, nombre")
    .eq("slug", torneoSlug)
    .single();

  if (!tournament) {
    return { ok: false, error: "Torneo no encontrado" };
  }

  let player2Id: string | null = null;
  if (data.compañero_email) {
    const { data: partner } = await admin
      .from("players")
      .select("id")
      .eq("email", data.compañero_email)
      .maybeSingle();
    player2Id = partner?.id ?? null;
  }

  // Inserción atómica: la función en BD bloquea el cupo mientras
  // decide, así dos inscripciones simultáneas no pueden pisarse
  // la última plaza (race condition señalada en la auditoría).
  const { data: resultado, error } = await admin.rpc("registrar_pareja", {
    p_tournament_id: tournament.id,
    p_categoria_id: data.categoria_id,
    p_player_1_id: player.id,
    p_player_2_id: player2Id,
    p_talla_camiseta: data.talla_camiseta,
  });

  if (error || !resultado?.[0]) {
    return { ok: false, error: "No se ha podido completar la inscripción" };
  }

  const estadoFinal = resultado[0].estado_final as string;

  if (data.quiere_bolsa_pareja && !player2Id) {
    await admin.from("partner_pool").insert({
      player_id: player.id,
      tournament_id: tournament.id,
      categoria_id: data.categoria_id,
      disponible: true,
    });
  }

  await sendRegistrationConfirmedEmail({
    to: player.email,
    nombre: player.nombre,
    torneoNombre: tournament.nombre,
    estado: estadoFinal === "lista_espera" ? "lista_espera" : "confirmada",
  });

  if (data.compañero_email && !player2Id) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    await sendPartnerInviteEmail({
      to: data.compañero_email,
      invitadoPorNombre: player.nombre,
      torneoNombre: tournament.nombre,
      signupUrl: `${siteUrl}/registro`,
    });
  }

  return { ok: true, estado: estadoFinal };
}