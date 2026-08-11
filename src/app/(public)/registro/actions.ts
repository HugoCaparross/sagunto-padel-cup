// Ruta: src/app/(public)/registro/actions.ts — sustituye entero al archivo actual
// (si aún tienes este archivo en src/app/registro/actions.ts sin mover, sustitúyelo ahí)
"use server";

import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

export async function signup(formData: unknown) {
  const parsed = signupSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Datos no válidos" };
  }
  const { nombre, apellidos, email, telefono, password } = parsed.data;

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // El jugador ya NO se crea aquí a mano: lo crea automáticamente
  // el trigger on_auth_user_created en la misma transacción que el
  // alta en Supabase Auth, así nunca queda un usuario sin jugador.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/app`,
      data: { nombre, apellidos, telefono },
    },
  });

  if (authError || !authData.user) {
    return {
      ok: false,
      error: authError?.message ?? "No se ha podido crear la cuenta",
    };
  }

  if (!authData.session) {
    redirect("/registro/confirma");
  }

  redirect("/app");
}