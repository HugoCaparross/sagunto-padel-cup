// Ruta: src/app/(public)/torneo/[slug]/resumen/[playerId]/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { obtenerNivelJugador } from "@/lib/gamification";

export default async function ResumenTorneoPage({
  params,
}: {
  params: Promise<{
    slug: string;
    playerId: string;
  }>;
}) {
  const { slug, playerId } = await params;

  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre")
    .eq("slug", slug)
    .maybeSingle();

  if (!torneo) {
    notFound();
  }

  const { data: jugador } = await supabase
    .from("players")
    .select("nombre, apellidos")
    .eq("id", playerId)
    .maybeSingle();

  if (!jugador) {
    notFound();
  }

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

  const totalPuntos =
    puntosVivos?.reduce((suma, punto) => suma + punto.puntos_obtenidos, 0) ?? 0;

  const nivel = await obtenerNivelJugador(supabase, playerId);

  const rondaLegible =
    resultado?.ronda_alcanzada?.replace(/_/g, " ") ?? "Participante";

  return (
    <main className="min-h-screen bg-navy px-5 py-16 text-offwhite sm:py-20">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-8 text-center">
          <p className="text-sm uppercase tracking-widest text-sage">
            Sagunto Padel Cup
          </p>

          <h1 className="mt-2 font-display text-3xl">{torneo.nombre}</h1>

          <p className="mt-2 text-sm text-offwhite/55">
            Resumen de participación
          </p>
        </header>

        <section
          aria-labelledby="resumen-jugador"
          className="border-y border-offwhite/15 py-6 sm:py-8"
        >
          <h2 id="resumen-jugador" className="sr-only">
            Resultado de {jugador.nombre} {jugador.apellidos}
          </h2>

          <p className="text-center text-2xl font-display">
            {jugador.nombre} {jugador.apellidos}
          </p>

          <p className="mt-2 text-center capitalize text-sage">
            {rondaLegible}
          </p>

          <div className="mt-8 grid gap-px border border-offwhite/15 bg-offwhite/15 sm:grid-cols-2">
            <div className="bg-navy p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-offwhite/45">
                Puntos obtenidos
              </p>

              <p className="mt-2 font-display text-4xl text-coral">
                +{resultado?.puntos_obtenidos ?? 0}
              </p>
            </div>

            <div className="bg-navy p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-offwhite/45">
                Ranking móvil
              </p>

              <p className="mt-2 font-display text-4xl">{totalPuntos}</p>
              <p className="mt-1 text-xs text-offwhite/45">Puntos vigentes</p>
            </div>
          </div>

          <div className="mt-4 border border-offwhite/15 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-offwhite/45">
              Nivel
            </p>
            <p className="mt-2 font-display text-2xl">{nivel.etiqueta}</p>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/jugador/${playerId}`}
            className="rounded-card border border-offwhite/20 px-4 py-2 text-sm font-semibold transition-colors hover:border-coral hover:text-coral"
          >
            Ver perfil
          </Link>

          <Link
            href={`/torneo/${slug}/resultados`}
            className="rounded-card border border-offwhite/20 px-4 py-2 text-sm font-semibold transition-colors hover:border-coral hover:text-coral"
          >
            Ver resultados
          </Link>

          <Link
            href={`/torneo/${slug}`}
            className="rounded-card border border-offwhite/20 px-4 py-2 text-sm font-semibold transition-colors hover:border-coral hover:text-coral"
          >
            Volver al torneo
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-offwhite/40">
          Los puntos del ranking se calculan sobre la ventana móvil vigente
          definida por la competición.
        </p>
      </div>
    </main>
  );
}
