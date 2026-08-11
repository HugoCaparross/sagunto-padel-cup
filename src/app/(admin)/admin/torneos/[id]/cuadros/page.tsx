// Ruta: src/app/(admin)/admin/torneos/[id]/cuadros/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import CuadroButton from "@/components/admin/CuadroButton";
import { ESTADO_PARTIDO } from "@/lib/estados";
import { notFound } from "next/navigation";

type BracketStructure = {
  num_parejas?: number;
  fase_inicial?: string;
  byes?: string[];
  enfrentamientos?: [string, string][];
};

type BracketRow = {
  id: string;
  tramo: string;
  categoria_id: string;
  estructura_json: BracketStructure | null;
};

type PlayerName = {
  nombre: string;
  apellidos: string;
} | null;

type PairRow = {
  id: string;
  player1: PlayerName;
  player2: PlayerName;
};

type MatchRow = {
  id: string;
  categoria_id: string;
  tramo: string;
  fase: string;
  estado: string;
  pair_1_id: string | null;
  pair_2_id: string | null;
  resultado_json: {
    ganador_id?: string;
  } | null;
};

export const dynamic = "force-dynamic";

export default async function CuadrosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const admin = createAdminClient();

  const { data: torneo, error: torneoError } = await admin
    .from("tournaments")
    .select("id, nombre, estado")
    .eq("id", id)
    .maybeSingle();

  if (torneoError) {
    console.error("[admin/cuadros] Error cargando torneo:", torneoError);
  }

  if (!torneo) {
    notFound();
  }

  const [
    { data: categorias, error: categoriasError },
    { data: brackets, error: bracketsError },
    { data: pairs, error: pairsError },
    { data: matches, error: matchesError },
  ] = await Promise.all([
    admin
      .from("tournament_categories")
      .select("categoria_id, categories(nombre)")
      .eq("tournament_id", id),

    admin
      .from("brackets")
      .select("id, tramo, categoria_id, estructura_json")
      .eq("tournament_id", id)
      .returns<BracketRow[]>(),

    admin
      .from("pairs")
      .select(
        "id, player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)",
      )
      .eq("tournament_id", id)
      .returns<PairRow[]>(),

    admin
      .from("matches")
      .select(
        "id, categoria_id, tramo, fase, estado, pair_1_id, pair_2_id, resultado_json",
      )
      .eq("tournament_id", id)
      .not("group_id", "is", null)
      .is("group_id", null)
      .returns<MatchRow[]>(),
  ]);

  if (categoriasError || bracketsError || pairsError || matchesError) {
    console.error("[admin/cuadros] Error cargando cuadros:", {
      categoriasError,
      bracketsError,
      pairsError,
      matchesError,
    });
  }

  const parejasPorId = new Map((pairs ?? []).map((pair) => [pair.id, pair]));

  function nombrePareja(pairId: string) {
    const pareja = parejasPorId.get(pairId);

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

  function estructuraSegura(estructura: BracketStructure | null) {
    return {
      num_parejas: estructura?.num_parejas ?? 0,
      fase_inicial: estructura?.fase_inicial ?? "Pendiente",
      byes: estructura?.byes ?? [],
      enfrentamientos: estructura?.enfrentamientos ?? [],
    };
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-8 border-b border-offwhite/10 pb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Administración · Competición
        </p>

        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          Cuadros
        </h1>

        <p className="mt-2 text-sm text-offwhite/55">{torneo.nombre}</p>
      </header>

      {!brackets?.length ? (
        <section className="mb-8 border border-dashed border-offwhite/15 px-5 py-8">
          <h2 className="text-sm font-semibold">
            Todavía no hay cuadros generados
          </h2>

          <p className="mt-1 max-w-xl text-sm leading-6 text-offwhite/55">
            Genera la fase final únicamente cuando los partidos de grupos estén
            completamente finalizados y revisados.
          </p>
        </section>
      ) : null}

      {categorias?.map((cat) => {
        const categoriaNombre =
          (
            cat.categories as unknown as {
              nombre: string;
            } | null
          )?.nombre ?? "Categoría";

        const bracketsCategoria =
          brackets?.filter(
            (bracket) => bracket.categoria_id === cat.categoria_id,
          ) ?? [];

        const matchesCategoria =
          matches?.filter((match) => match.categoria_id === cat.categoria_id) ??
          [];

        return (
          <section
            key={cat.categoria_id}
            className="mb-12"
            aria-labelledby={`categoria-${cat.categoria_id}`}
          >
            <div className="mb-5 flex flex-col gap-4 border-b border-offwhite/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id={`categoria-${cat.categoria_id}`}
                  className="font-display text-2xl"
                >
                  {categoriaNombre}
                </h2>

                <p className="mt-1 text-sm text-offwhite/50">
                  {bracketsCategoria.length}{" "}
                  {bracketsCategoria.length === 1
                    ? "cuadro generado"
                    : "cuadros generados"}
                </p>
              </div>

              <CuadroButton torneoId={id} categoriaId={cat.categoria_id} />
            </div>

            {!bracketsCategoria.length ? (
              <div className="border border-dashed border-offwhite/15 px-5 py-7">
                <p className="text-sm text-offwhite/55">
                  No existe todavía un cuadro para esta categoría.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {(["oro", "plata", "bronce"] as const).map((tramo) => {
                  const bracket = bracketsCategoria.find(
                    (item) => item.tramo === tramo,
                  );

                  if (!bracket) {
                    return null;
                  }

                  const estructura = estructuraSegura(bracket.estructura_json);

                  const partidosTramo = matchesCategoria.filter(
                    (match) => match.tramo === tramo,
                  );

                  return (
                    <article
                      key={tramo}
                      className="border border-offwhite/10 bg-navy-light p-5"
                    >
                      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sage">
                            Tramo
                          </p>

                          <h3 className="mt-1 font-display text-xl capitalize">
                            {tramo}
                          </h3>
                        </div>

                        <p className="text-xs text-offwhite/45">
                          {estructura.num_parejas}{" "}
                          {estructura.num_parejas === 1 ? "pareja" : "parejas"}
                        </p>
                      </div>

                      {estructura.byes.length > 0 ? (
                        <div className="mb-5 border-l-2 border-sage pl-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sage">
                            Bye directo
                          </p>

                          <p className="mt-1 text-sm leading-6 text-offwhite/65">
                            {estructura.byes.map(nombrePareja).join(", ")}
                          </p>
                        </div>
                      ) : null}

                      {estructura.enfrentamientos.length > 0 ? (
                        <div className="mb-6">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-offwhite/40">
                            Primera ronda
                          </p>

                          <ul className="divide-y divide-offwhite/10 border-y border-offwhite/10">
                            {estructura.enfrentamientos.map(
                              ([pair1Id, pair2Id], index) => (
                                <li
                                  key={`${pair1Id}-${pair2Id}-${index}`}
                                  className="py-3 text-sm"
                                >
                                  <span className="text-offwhite/45">
                                    {index + 1}.
                                  </span>{" "}
                                  {nombrePareja(pair1Id)}
                                  <span className="mx-2 text-offwhite/30">
                                    vs
                                  </span>
                                  {nombrePareja(pair2Id)}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      ) : null}

                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-offwhite/40">
                          Partidos generados
                        </p>

                        {partidosTramo.length ? (
                          <ul className="divide-y divide-offwhite/10 border-y border-offwhite/10">
                            {partidosTramo.map((match) => (
                              <li
                                key={match.id}
                                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {match.fase}
                                  </p>

                                  <p className="mt-1 text-xs text-offwhite/55">
                                    {match.pair_1_id
                                      ? nombrePareja(match.pair_1_id)
                                      : "Pendiente"}{" "}
                                    <span className="text-offwhite/30">vs</span>{" "}
                                    {match.pair_2_id
                                      ? nombrePareja(match.pair_2_id)
                                      : "Pendiente"}
                                  </p>
                                </div>

                                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-sage">
                                  {ESTADO_PARTIDO[match.estado] ?? match.estado}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-offwhite/50">
                            No hay partidos disponibles todavía.
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
