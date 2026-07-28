// Ruta: src/app/registro/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signupSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

export async function signup(formData: unknown) {
  const parsed = signupSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Datos no válidos" };
  }
  const { nombre, apellidos, email, telefono, password } = parsed.data;

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return {
      ok: false,
      error: authError?.message ?? "No se ha podido crear la cuenta",
    };
  }

  const admin = createAdminClient();
  const { error: playerError } = await admin.from("players").insert({
    auth_user_id: authData.user.id,
    nombre,
    apellidos,
    email,
    telefono,
  });

  if (playerError) {
    return { ok: false, error: "No se ha podido crear tu perfil de jugador" };
  }

  redirect("/app");
}