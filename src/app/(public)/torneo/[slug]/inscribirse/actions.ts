// Ruta: src/app/(public)/torneo/[slug]/inscribirse/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrationSchema } from "@/lib/validations/registration";
import { sendRegistrationConfirmedEmail } from "@/lib/email/resend";

export async function registerPair(
  torneoSlug: string,
  formData: unknown
) {
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

  // Compañero: si da su email y ya está registrado, se vincula directamente.
  // Si no existe todavía, la pareja queda "incompleta" hasta que se registre.
  let player2Id: string | null = null;
  if (data.compañero_email) {
    const { data: partner } = await admin
      .from("players")
      .select("id")
      .eq("email", data.compañero_email)
      .maybeSingle();
    player2Id = partner?.id ?? null;
  }

  // Cupo: contar parejas confirmadas de esa categoría en ese torneo
  const { count: confirmadas } = await admin
    .from("pairs")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournament.id)
    .eq("categoria_id", data.categoria_id)
    .eq("estado", "confirmada");

  const { data: cupoRow } = await admin
    .from("tournament_categories")
    .select("cupo_maximo")
    .eq("tournament_id", tournament.id)
    .eq("categoria_id", data.categoria_id)
    .single();

  const cupoMaximo = cupoRow?.cupo_maximo ?? 12;
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

  await sendRegistrationConfirmedEmail({
    to: player.email,
    nombre: player.nombre,
    torneoNombre: tournament.nombre,
    estado: estadoFinal === "lista_espera" ? "lista_espera" : "confirmada",
  });

  return { ok: true, estado: estadoFinal };
}