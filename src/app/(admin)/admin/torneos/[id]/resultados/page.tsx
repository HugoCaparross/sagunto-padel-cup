// Ruta: src/app/(admin)/admin/torneos/[id]/resultados/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import ResultadoForm from "@/components/admin/ResultadoForm";
import { ESTADO_PARTIDO } from "@/lib/estados";
import { notFound } from "next/navigation";

type MatchRow = {
  id: string;
  pista: string | null;
  estado: string;
  fase: string;
  tramo: string | null;
  resultado_json: {
    sets: {
      juegos_pair1: number;
      juegos_pair2: number;
    }[];
  } | null;
  pair1: {
    player1: {
      nombre: string;
      apellidos: string;
    } | null;
    player2: {
      nombre: string;
      apellidos: string;
    } | null;
  } | null;
  pair2: {
    player1: {
      nombre: string;
      apellidos: string;
    } | null;
    player2: {
      nombre: string;
      apellidos: string;
    } | null;
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

function resultadoTexto(resultado: MatchRow["resultado_json"]) {
  if (!resultado?.sets?.length) {
    return "Sin marcador";
  }

  return resultado.sets
    .map((set) => `${set.juegos_pair1}-${set.juegos_pair2}`)
    .join(", ");
}

export const dynamic = "force-dynamic";

export default async function ResultadosPage({
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
        "id, pista, estado, fase, tramo, resultado_json, pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))",
      )
      .eq("tournament_id", id)
      .order("hora_programada", {
        ascending: true,
        nullsFirst: true,
      })
      .returns<MatchRow[]>(),
  ]);

  if (torneoError) {
    console.error("[admin/resultados] Error cargando torneo:", torneoError);
  }

  if (partidosError) {
    console.error("[admin/resultados] Error cargando partidos:", partidosError);
  }

  if (!torneo) {
    notFound();
  }

  const pendientes =
    partidos?.filter(
      (partido) =>
        partido.estado === "pendiente" && partido.pair1 && partido.pair2,
    ) ?? [];

  const finalizados =
    partidos?.filter((partido) => partido.estado === "finalizado") ?? [];

  const otros =
    partidos?.filter(
      (partido) =>
        partido.estado !== "pendiente" && partido.estado !== "finalizado",
    ) ?? [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8 border-b border-offwhite/10 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración · Competición
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-tight md:text-4xl">
              Resultados
            </h1>

            <p className="mt-2 text-sm text-offwhite/55">{torneo.nombre}</p>
          </div>

          <div className="flex gap-4 text-xs text-offwhite/45">
            <span>{pendientes.length} pendientes</span>

            <span>{finalizados.length} finalizados</span>
          </div>
        </div>
      </header>

      {partidosError ? (
        <section
          role="alert"
          className="mb-8 border border-coral/30 bg-coral/10 px-5 py-5"
        >
          <h2 className="text-sm font-semibold">
            No se han podido cargar los partidos
          </h2>

          <p className="mt-1 text-sm leading-6 text-offwhite/60">
            No introduzcas resultados hasta poder verificar que el listado está
            actualizado.
          </p>
        </section>
      ) : null}

      <section aria-labelledby="resultados-pendientes">
        <div className="mb-4">
          <h2 id="resultados-pendientes" className="font-display text-xl">
            Pendientes
          </h2>

          <p className="mt-1 text-sm text-offwhite/50">
            Solo aparecen aquí partidos con ambas parejas asignadas.
          </p>
        </div>

        <div className="space-y-4">
          {pendientes.map((partido) => (
            <div key={partido.id}>
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-offwhite/45">
                {partido.tramo ? (
                  <span className="capitalize text-sage">{partido.tramo}</span>
                ) : null}

                <span>{partido.fase}</span>

                {partido.pista ? <span>{partido.pista}</span> : null}
              </div>

              <ResultadoForm
                torneoId={id}
                matchId={partido.id}
                nombrePair1={nombrePareja(partido.pair1)}
                nombrePair2={nombrePareja(partido.pair2)}
              />
            </div>
          ))}

          {!pendientes.length ? (
            <div className="border border-dashed border-offwhite/15 px-5 py-8">
              <p className="text-sm font-semibold">
                No hay partidos pendientes.
              </p>

              <p className="mt-1 text-sm text-offwhite/50">
                Cuando haya partidos preparados para jugarse aparecerán aquí.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="resultados-finalizados" className="mt-12">
        <div className="mb-4">
          <h2 id="resultados-finalizados" className="font-display text-xl">
            Finalizados
          </h2>
        </div>

        {finalizados.length ? (
          <ul className="divide-y divide-offwhite/10 border-y border-offwhite/10">
            {finalizados.map((partido) => (
              <li
                key={partido.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {nombrePareja(partido.pair1)}
                  </p>

                  <p className="mt-1 text-sm text-offwhite/45">
                    vs {nombrePareja(partido.pair2)}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <span className="text-sm font-semibold">
                    {resultadoTexto(partido.resultado_json)}
                  </span>

                  <span className="text-xs uppercase tracking-[0.06em] text-sage">
                    {ESTADO_PARTIDO[partido.estado] ?? partido.estado}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-offwhite/50">
            Todavía no hay resultados finalizados.
          </p>
        )}
      </section>

      {otros.length ? (
        <section aria-labelledby="resultados-otros" className="mt-12">
          <div className="mb-4">
            <h2 id="resultados-otros" className="font-display text-xl">
              Otros estados
            </h2>
          </div>

          <ul className="divide-y divide-offwhite/10 border-y border-offwhite/10">
            {otros.map((partido) => (
              <li
                key={partido.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <span className="text-sm">{nombrePareja(partido.pair1)}</span>

                <span className="text-xs uppercase tracking-[0.06em] text-offwhite/45">
                  {ESTADO_PARTIDO[partido.estado] ?? partido.estado}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
