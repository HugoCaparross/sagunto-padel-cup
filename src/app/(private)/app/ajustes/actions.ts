// Ruta: src/app/(private)/app/ajustes/actions.ts

"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

const passwordSchema = z
  .string()
  .min(8, {
    message:
      "La contraseña debe tener al menos 8 caracteres",
  })
  .max(128, {
    message:
      "La contraseña no puede superar los 128 caracteres",
  });

export async function cambiarPassword(
  nuevaPassword: string
) {
  const parsed =
    passwordSchema.safeParse(nuevaPassword);

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "La contraseña no es válida",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(
      "[app/ajustes] Error obteniendo usuario:",
      userError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar tu sesión",
    };
  }

  if (!user) {
    return {
      ok: false,
      error:
        "Tu sesión ha expirado. Vuelve a iniciar sesión.",
    };
  }

  const { error } =
    await supabase.auth.updateUser({
      password: parsed.data,
    });

  if (error) {
    console.error(
      "[app/ajustes] Error cambiando contraseña:",
      error
    );

    return {
      ok: false,
      error:
        "No se ha podido cambiar la contraseña",
    };
  }

  return {
    ok: true,
  };
}

export async function darseDeBaja() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error(
      "[app/ajustes] Error obteniendo usuario:",
      userError
    );

    return {
      ok: false,
      error:
        "No se ha podido comprobar tu sesión",
    };
  }

  if (!user) {
    return {
      ok: false,
      error:
        "No has iniciado sesión",
    };
  }

  const admin = createAdminClient();

  const {
    data: player,
    error: playerError,
  } = await admin
    .from("players")
    .select("id, estado")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (playerError) {
    console.error(
      "[app/ajustes] Error buscando jugador:",
      playerError
    );

    return {
      ok: false,
      error:
        "No se ha podido localizar tu cuenta",
    };
  }

  if (!player) {
    return {
      ok: false,
      error:
        "No se ha encontrado el perfil asociado a tu cuenta",
    };
  }

  if (player.estado === "baja") {
    return {
      ok: false,
      error:
        "La cuenta ya está dada de baja",
    };
  }

  const {
    error: updateError,
  } = await admin
    .from("players")
    .update({
      estado: "baja",
    })
    .eq("id", player.id)
    .eq(
      "auth_user_id",
      user.id
    );

  if (updateError) {
    console.error(
      "[app/ajustes] Error tramitando baja:",
      updateError
    );

    return {
      ok: false,
      error:
        "No se ha podido tramitar la baja",
    };
  }

  const {
    error: auditError,
  } = await admin.from("audit_log").insert({
    entidad: "players",
    entidad_id: player.id,
    accion: "cuenta_dada_de_baja",
    valores_anteriores_json: {
      estado: player.estado,
    },
    valores_nuevos_json: {
      estado: "baja",
    },
    fecha: new Date().toISOString(),
  });

  if (auditError) {
    console.error(
      "[app/ajustes] Error registrando auditoría de baja:",
      auditError
    );
  }

  const {
    error: signOutError,
  } = await supabase.auth.signOut();

  if (signOutError) {
    console.error(
      "[app/ajustes] Error cerrando sesión:",
      signOutError
    );
  }

  redirect("/");
}