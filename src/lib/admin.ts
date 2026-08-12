// Ruta: src/lib/admin.ts

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "admin" | "colaborador";

type StaffUser = {
  id: string;
  email?: string | null;
  role: StaffRole;
};

async function getStaffUser(): Promise<StaffUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: player, error } = await supabase
    .from("players")
    .select("role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[admin] Error comprobando rol de usuario:", error);

    return null;
  }

  if (player?.role !== "admin" && player?.role !== "colaborador") {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: player.role,
  };
}

export async function requireAdmin() {
  const staff = await getStaffUser();

  if (!staff || staff.role !== "admin") {
    redirect("/login");
  }

  return {
    id: staff.id,
    email: staff.email,
  };
}

export async function requireStaff() {
  const staff = await getStaffUser();

  if (!staff) {
    redirect("/login");
  }

  return staff;
}

export async function esAdmin(userId: string | undefined) {
  if (!userId) {
    return false;
  }

  const supabase = await createClient();

  const { data: player, error } = await supabase
    .from("players")
    .select("role")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[admin] Error comprobando administrador:", error);

    return false;
  }

  return player?.role === "admin";
}

export async function esStaff(userId: string | undefined) {
  if (!userId) {
    return false;
  }

  const supabase = await createClient();

  const { data: player, error } = await supabase
    .from("players")
    .select("role")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[admin] Error comprobando colaborador:", error);

    return false;
  }

  return player?.role === "admin" || player?.role === "colaborador";
}
