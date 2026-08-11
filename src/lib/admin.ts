// Ruta: src/lib/admin.ts — sustituye entero al archivo actual
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (player?.role !== "admin") redirect("/login");

  return user;
}

export async function esAdmin(userId: string | undefined) {
  if (!userId) return false;
  const supabase = await createClient();
  const { data: player } = await supabase
    .from("players")
    .select("role")
    .eq("auth_user_id", userId)
    .single();
  return player?.role === "admin";
}