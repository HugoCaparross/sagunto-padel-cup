// Ruta: src/lib/admin.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: player } = await supabase
    .from("players")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (player?.role !== "admin") {
    redirect("/login");
  }

  return user;
}

export async function esAdmin(
  userId: string | undefined
) {
  if (!userId) {
    return false;
  }

  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("role")
    .eq("auth_user_id", userId)
    .maybeSingle();

  return player?.role === "admin";
}