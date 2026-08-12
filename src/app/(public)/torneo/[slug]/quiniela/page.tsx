// Ruta: src/app/(public)/torneo/[slug]/quiniela/page.tsx

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import QuinielaCard from "@/components/QuinielaCard";

type PlayerName = {
  nombre: string;
  apellidos: string;
} | null;

type MatchRow = {
  id: string;
  pair_1_id: string;
  pair_2_id: string;
  fase: string | null;
  pair1: {
    player1: PlayerName;
    player2: PlayerName;
  } | null;
  pair2: {
    player1: PlayerName;
    player2: PlayerName;
  } | null;
};

function nombre(pareja: MatchRow["pair1"]) {
  if (!pareja) {
    return "?";
  }

  const nombre1 = pareja.player1
    ? `${pareja.player1.nombre} ${pareja.player1.apellidos}`
    : "?";

  const nombre2 = pareja.player2
    ? ` / ${pareja.player2.nombre} ${pareja.player2.apellidos}`
    : "";

  return nombre1 + nombre2;
}

export default async function QuinielaPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre, estado")
    .eq("slug", slug)
    .maybeSingle();

  if (!torneo) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: player } = user
    ? await supabase
        .from("players")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: partidos } = await supabase
    .from("matches")
    .select(
      "id, pair_1_id, pair_2_id, fase, pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))",
    )
    .eq("tournament_id", torneo.id)
    .eq("estado", "pendiente")
    .not("pair_1_id", "is", null)
    .not("pair_2_id", "is", null)
    .returns<MatchRow[]>();

  const { data: misVotos } = player
    ? await supabase
        .from("predicciones")
        .select("match_id, pareja_predicha_id")
        .eq("player_id", player.id)
    : { data: null };

  const quinielaDisponible =
    torneo.estado === "en_juego" || torneo.estado === "inscripciones_cerradas";

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Quiniela</h1>

        <p className="mt-2 text-navy/70">{torneo.nombre}</p>
      </header>

      <section
        aria-labelledby="reglas-quiniela"
        className="mb-8 rounded-card bg-navy/5 p-5"
      >
        <h2 id="reglas-quiniela" className="font-semibold">
          Cómo funciona
        </h2>

        <ul className="mt-2 space-y-1 text-sm text-navy/70">
          <li>Elige qué pareja crees que ganará cada cruce disponible.</li>
          <li>
            Puedes modificar tu pronóstico mientras el partido siga pendiente.
          </li>
          <li>
            Cuando el partido deje de estar pendiente, el pronóstico queda
            cerrado.
          </li>
        </ul>
      </section>

      {!user ? (
        <section
          role="status"
          className="mb-6 rounded-card border border-navy/10 bg-white p-5 text-sm text-navy/70"
        >
          Inicia sesión para poder realizar y modificar tus pronósticos.
        </section>
      ) : null}

      {!quinielaDisponible ? (
        <section
          role="status"
          className="rounded-card bg-navy/5 p-6 text-sm text-navy/70"
        >
          La quiniela todavía no está disponible para esta prueba.
        </section>
      ) : partidos?.length ? (
        <div className="space-y-4">
          {partidos.map((partido) => (
            <section
              key={partido.id}
              aria-labelledby={`quiniela-${partido.id}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2
                  id={`quiniela-${partido.id}`}
                  className="text-sm font-semibold"
                >
                  {partido.fase ?? "Partido"}
                </h2>
              </div>

              <QuinielaCard
                slug={slug}
                matchId={partido.id}
                pareja1={{
                  id: partido.pair_1_id,
                  nombre: nombre(partido.pair1),
                }}
                pareja2={{
                  id: partido.pair_2_id,
                  nombre: nombre(partido.pair2),
                }}
                votoInicial={
                  misVotos?.find((voto) => voto.match_id === partido.id)
                    ?.pareja_predicha_id ?? null
                }
              />
            </section>
          ))}
        </div>
      ) : (
        <section
          role="status"
          className="rounded-card bg-navy/5 p-6 text-sm text-navy/70"
        >
          No hay partidos pendientes de pronóstico ahora mismo. Los pronósticos
          se cierran cuando el partido deja de estar pendiente.
        </section>
      )}
    </main>
  );
}
