import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/FormularioAuth";
import { usuarioActual } from "@/lib/auth/organizador";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Completa tu perfil" };

export default async function PaginaOnboarding() {
  const usuarioId = await usuarioActual();
  if (!usuarioId) redirect("/login?siguiente=/onboarding");

  const supabase = await crearClienteServidor();
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, onboarding_completado_at")
    .eq("id", usuarioId)
    .maybeSingle<{ nombre: string; onboarding_completado_at: string | null }>();

  if (perfil?.onboarding_completado_at) redirect("/cuenta");

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Completa tu perfil</h1>
        <p className="text-sm text-[var(--color-muted)]">Solo tendrás que hacerlo una vez.</p>
      </header>
      <OnboardingForm nombreInicial={perfil?.nombre ?? ""} />
    </main>
  );
}