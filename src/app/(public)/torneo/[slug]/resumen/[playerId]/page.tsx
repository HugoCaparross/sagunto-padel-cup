// Ruta: src/app/(public)/torneo/[slug]/resumen/[playerId]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { obtenerNivelJugador } from "@/lib/gamification";

export default async function ResumenTorneoPage({
  params,
}: {
  params: Promise<{ slug: string; playerId: string }>;
}) {
  const { slug, playerId } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre")
    .eq("slug", slug)
    .single();
  if (!torneo) notFound();

  const { data: jugador } = await supabase
    .from("players")
    .select("nombre, apellidos")
    .eq("id", playerId)
    .single();
  if (!jugador) notFound();

  const { data: resultado } = await supabase
    .from("ranking_points")
    .select("puntos_obtenidos, ronda_alcanzada")
    .eq("tournament_id", torneo.id)
    .eq("player_id", playerId)
    .maybeSingle();

  const hoy = new Date().toISOString().slice(0, 10);
  const { data: puntosVivos } = await supabase
    .from("ranking_points")
    .select("puntos_obtenidos")
    .eq("player_id", playerId)
    .gte("fecha_caducidad", hoy);
  const totalPuntos = puntosVivos?.reduce((s, p) => s + p.puntos_obtenidos, 0) ?? 0;

  const nivel = await obtenerNivelJugador(supabase, playerId);

  const rondaLegible = resultado?.ronda_alcanzada?.replace(/_/g, " ") ?? "Participante";

  return (
    <main className="min-h-screen bg-navy text-offwhite flex items-center justify-center px-5 py-16">
      <div className="max-w-sm w-full text-center space-y-6">
        <p className="text-sage uppercase text-sm tracking-widest">
          Sagunto Padel Cup
        </p>
        <h1 className="font-display text-3xl">{torneo.nombre}</h1>

        <div className="rounded-card bg-navy-light p-8 space-y-4">
          <p className="text-2xl font-display">
            {jugador.nombre} {jugador.apellidos}
          </p>
          <p className="text-sage capitalize">{rondaLegible}</p>

          {resultado && (
            <p className="font-display text-5xl text-coral">
              +{resultado.puntos_obtenidos}
              <span className="text-lg block text-offwhite/60">puntos</span>
            </p>
          )}

          <div className="flex justify-around pt-4 border-t border-offwhite/10 text-sm">
            <div>
              <p className="text-offwhite/50">Ranking total</p>
              <p className="font-display text-xl">{totalPuntos}</p>
            </div>
            <div>
              <p className="text-offwhite/50">Nivel</p>
              <p className="font-display text-xl">{nivel.etiqueta}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-offwhite/40">
          Haz captura y comparte tu resultado 📸
        </p>
      </div>
    </main>
  );
}