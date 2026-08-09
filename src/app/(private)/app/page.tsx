// Ruta: src/app/(private)/app/page.tsx — sustituye entero al archivo actual
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import OnboardingModal from "@/components/OnboardingModal";
import { obtenerNivelJugador } from "@/lib/gamification";
import NivelBadge from "@/components/NivelBadge";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("id, nombre, categoria_actual_id, categories(nombre), onboarding_completado")
    .eq("auth_user_id", user.id)
    .single();

  const hoy = new Date().toISOString().slice(0, 10);
  const { data: puntos } = await supabase
    .from("ranking_points")
    .select("puntos_obtenidos")
    .eq("player_id", player?.id ?? "")
    .gte("fecha_caducidad", hoy);

  const totalPuntos = puntos?.reduce((sum, p) => sum + p.puntos_obtenidos, 0) ?? 0;
  const nivel = player ? await obtenerNivelJugador(supabase, player.id) : null;

  const { data: inscripciones } = await supabase
    .from("pairs")
    .select("estado, tournaments(nombre, slug, estado), categories(nombre)")
    .or(`player_1_id.eq.${player?.id ?? ""},player_2_id.eq.${player?.id ?? ""}`);

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      {!player?.onboarding_completado && <OnboardingModal />}

      <h1 className="font-display text-3xl mb-1">Hola, {player?.nombre}</h1>
      <p className="text-navy/70 mb-8">
        {(player?.categories as unknown as { nombre: string })?.nombre ?? "Sin categoría asignada"}
      </p>

      <div className="flex flex-wrap gap-4 mb-10">
        <div className="rounded-card bg-navy text-offwhite p-5">
          <p className="text-sage text-sm uppercase mb-1">Puntos de ranking</p>
          <p className="font-display text-3xl">{totalPuntos}</p>
        </div>
        {nivel && (
          <NivelBadge etiqueta={nivel.etiqueta} xp={nivel.xp} siguienteUmbral={nivel.siguienteUmbral} />
        )}
        <Link
          href="/calendario"
          className="rounded-card bg-coral text-offwhite p-5 flex flex-col justify-center"
        >
          <p className="font-display text-lg">Ver próximos torneos</p>
        </Link>
      </div>

      <h2 className="font-display text-xl mb-3">Mis inscripciones</h2>
      <ul className="space-y-2">
        {inscripciones?.map((i, idx) => {
          const torneo = i.tournaments as unknown as { nombre: string; slug: string } | null;
          return (
            <li key={idx} className="rounded-card bg-navy/5 px-4 py-3 flex justify-between">
              <Link href={`/torneo/${torneo?.slug}`} className="underline">
                {torneo?.nombre}
              </Link>
              <span className="text-sm text-navy/60">{i.estado}</span>
            </li>
          );
        })}
        {!inscripciones?.length && (
          <p className="text-navy/70 text-sm">Aún no te has inscrito a ningún torneo.</p>
        )}
      </ul>
    </main>
  );
}