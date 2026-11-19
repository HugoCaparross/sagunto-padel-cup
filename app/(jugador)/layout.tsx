import { redirect } from "next/navigation";
import PlayerNav from "@/components/layout/PlayerNav";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { usuarioActual } from "@/lib/auth/organizador";
import { crearClienteServidor } from "@/lib/supabase/server";

export default async function LayoutJugador({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const usuarioId = await usuarioActual();
  if (!usuarioId) redirect("/login");

  const supabase = await crearClienteServidor();
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("onboarding_completado_at")
    .eq("id", usuarioId)
    .maybeSingle<{ onboarding_completado_at: string | null }>();

  if (!perfil?.onboarding_completado_at) redirect("/onboarding");

  return (
    <>
      <SiteHeader />
      <PlayerNav />
      <div className="min-h-[70vh]">{children}</div>
      <SiteFooter />
    </>
  );
}