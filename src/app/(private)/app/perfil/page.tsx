// Ruta: src/app/(private)/app/perfil/page.tsx
import { createClient } from "@/lib/supabase/server";
import PerfilForm from "@/components/PerfilForm";
import { redirect } from "next/navigation";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("ciudad, mano_dominante, pala, instagram, visibilidad_json")
    .eq("auth_user_id", user.id)
    .single();

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Mi perfil</h1>
      <PerfilForm
        inicial={{
          ciudad: player?.ciudad ?? "",
          mano_dominante: player?.mano_dominante ?? "",
          pala: player?.pala ?? "",
          instagram: player?.instagram ?? "",
          visibilidad_json: (player?.visibilidad_json as Record<string, boolean>) ?? {},
        }}
      />
    </main>
  );
}