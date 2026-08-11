// Ruta: src/app/(admin)/admin/torneos/[id]/horarios/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import HorariosTable from "@/components/admin/HorariosTable";
import { notFound } from "next/navigation";

type PlayerName = {
  nombre: string;
  apellidos: string;
} | null;

type MatchRow = {
  id: string;
  pista: string | null;
  hora_programada: string | null;
  estado: string;
  pair1: {
    player1: PlayerName;
    player2: PlayerName;
  } | null;
  pair2: {
    player1: PlayerName;
    player2: PlayerName;
  } | null;
};

function nombrePareja(pareja: MatchRow["pair1"]) {
  if (!pareja) {
    return "Pareja pendiente";
  }

  const jugador1 = pareja.player1
    ? `${pareja.player1.nombre} ${pareja.player1.apellidos}`
    : "Jugador pendiente";

  const jugador2 = pareja.player2
    ? ` / ${pareja.player2.nombre} ${pareja.player2.apellidos}`
    : "";

  return `${jugador1}${jugador2}`;
}

export const dynamic = "force-dynamic";

export default async function AdminHorariosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const admin = createAdminClient();

  const [
    { data: torneo, error: torneoError },
    { data: partidos, error: partidosError },
  ] = await Promise.all([
    admin.from("tournaments").select("id, nombre").eq("id", id).maybeSingle(),

    admin
      .from("matches")
      .select(
        "id, pista, hora_programada, estado, pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))",
      )
      .eq("tournament_id", id)
      .not("pair_1_id", "is", null)
      .not("pair_2_id", "is", null)
      .order("hora_programada", {
        ascending: true,
        nullsFirst: false,
      })
      .returns<MatchRow[]>(),
  ]);

  if (torneoError) {
    console.error("[admin/horarios] Error cargando torneo:", torneoError);
  }

  if (partidosError) {
    console.error("[admin/horarios] Error cargando partidos:", partidosError);
  }

  if (!torneo) {
    notFound();
  }

  const filas = (partidos ?? []).map((partido) => ({
    id: partido.id,
    pista: partido.pista ?? "",
    horaProgramada: partido.hora_programada
      ? partido.hora_programada.slice(0, 16)
      : "",
    jugadores: `${nombrePareja(
      partido.pair1,
    )} vs ${nombrePareja(partido.pair2)}`,
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8 border-b border-offwhite/10 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración · Competición
        </p>

        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          Horarios
        </h1>

        <p className="mt-2 text-sm text-offwhite/55">{torneo.nombre}</p>
      </header>

      {partidosError ? (
        <section
          role="alert"
          className="mb-6 border border-coral/30 bg-coral/10 px-5 py-5"
        >
          <h2 className="text-sm font-semibold">
            No se han podido cargar los partidos
          </h2>

          <p className="mt-1 text-sm leading-6 text-offwhite/60">
            Revisa la conexión e inténtalo de nuevo.
          </p>
        </section>
      ) : null}

      <section aria-label="Planificación de partidos" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl">Planning de partidos</h2>

            <p className="mt-1 text-sm text-offwhite/50">
              Asigna pista y hora evitando conflictos de planificación.
            </p>
          </div>

          <p className="text-xs text-offwhite/40">
            {filas.length} {filas.length === 1 ? "partido" : "partidos"}
          </p>
        </div>

        <HorariosTable torneoId={id} filas={filas} />
      </section>
    </main>
  );
}
