// Ruta: src/app/(private)/app/notificaciones/page.tsx
import { createClient } from "@/lib/supabase/server";
import NotificacionesList from "@/components/NotificacionesList";
import { redirect } from "next/navigation";

export default async function NotificacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const { data: notificaciones } = await supabase
    .from("notifications")
    .select("id, tipo, contenido, leido, fecha_envio")
    .eq("player_id", player?.id ?? "")
    .order("fecha_envio", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Notificaciones</h1>
      <NotificacionesList iniciales={notificaciones ?? []} />
    </main>
  );
}