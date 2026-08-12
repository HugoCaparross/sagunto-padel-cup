// Ruta: src/app/(public)/torneo/[slug]/grupos/page.tsx

export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  ordenarClasificacionGrupo,
  type Standing,
  type PartidoResuelto,
} from "@/lib/grupos";

type PlayerName = {
  nombre: string;
  apellidos: string;
} | null;

type StandingRow = Standing & {
  group_id: string;
  victorias: number;
  derrotas: number;
  pair: {
    player1: PlayerName;
    player2: PlayerName;
  } | null;
};

export default async function GruposPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre")
    .eq("slug", slug)
    .single();

  if (!torneo) {
    notFound();
  }

  const { data: categorias } = await supabase
    .from("tournament_categories")
    .select("categoria_id, categories(nombre)")
    .eq("tournament_id", torneo.id);

  const { data: grupos } = await supabase
    .from("groups")
    .select("id, nombre, categoria_id")
    .eq("tournament_id", torneo.id);

  const { data: standings } = await supabase
    .from("group_standings")
    .select(
      "group_id, pair_id, puntos, victorias, derrotas, sets_favor, sets_contra, juegos_favor, juegos_contra, pair:pairs(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))",
    )
    .returns<StandingRow[]>();

  const { data: partidos } = await supabase
    .from("matches")
    .select("group_id, pair_1_id, pair_2_id, resultado_json")
    .eq("tournament_id", torneo.id)
    .eq("fase", "grupos")
    .eq("estado", "finalizado");

  const partidosResueltos: PartidoResuelto[] = (partidos ?? []).map(
    (partido) => ({
      pair_1_id: partido.pair_1_id,
      pair_2_id: partido.pair_2_id,
      resultado_json: partido.resultado_json as {
        ganador_id?: string;
      } | null,
    }),
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display mb-2 text-3xl">Clasificación de grupos</h1>

        <p className="text-navy/70">{torneo.nombre}</p>
      </header>

      {categorias?.map((cat) => (
        <section key={cat.categoria_id} className="mb-10">
          <h2 className="font-display mb-3 text-xl">
            {
              (
                cat.categories as unknown as {
                  nombre: string;
                }
              )?.nombre
            }
          </h2>

          {grupos
            ?.filter((grupo) => grupo.categoria_id === cat.categoria_id)
            .map((grupo) => {
              const filasGrupo =
                standings?.filter(
                  (standing) => standing.group_id === grupo.id,
                ) ?? [];

              const partidosGrupo = partidosResueltos.filter((partido) => {
                const partidoOriginal = partidos?.find(
                  (item) =>
                    item.pair_1_id === partido.pair_1_id &&
                    item.pair_2_id === partido.pair_2_id &&
                    item.group_id === grupo.id,
                );

                return partidoOriginal?.group_id === grupo.id;
              });

              const orden = ordenarClasificacionGrupo(
                filasGrupo,
                partidosGrupo,
              );

              return (
                <div key={grupo.id} className="mb-4 overflow-x-auto">
                  <p className="mb-2 font-semibold">{grupo.nombre}</p>

                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-navy/10 text-left text-navy/60">
                        <th scope="col" className="py-2 pr-4">
                          Pareja
                        </th>

                        <th scope="col" className="py-2 text-center">
                          Pts
                        </th>

                        <th scope="col" className="py-2 text-center">
                          V-D
                        </th>

                        <th scope="col" className="py-2 text-center">
                          Sets
                        </th>

                        <th scope="col" className="py-2 text-center">
                          Juegos
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {orden.map((fila) => {
                        const standing = filasGrupo.find(
                          (item) => item.pair_id === fila.pair_id,
                        );

                        if (!standing) {
                          return null;
                        }

                        return (
                          <tr
                            key={fila.pair_id}
                            className="border-b border-navy/5"
                          >
                            <td className="py-2 pr-4">
                              {nombrePareja(standing.pair)}
                            </td>

                            <td className="py-2 text-center font-semibold">
                              {fila.puntos}
                            </td>

                            <td className="py-2 text-center">
                              {standing.victorias}-{standing.derrotas}
                            </td>

                            <td className="py-2 text-center">
                              {fila.sets_favor}-{fila.sets_contra}
                            </td>

                            <td className="py-2 text-center">
                              {fila.juegos_favor}-{fila.juegos_contra}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
        </section>
      ))}

      {!grupos?.length ? (
        <p className="text-navy/70">Aún no se ha generado el sorteo.</p>
      ) : null}
    </main>
  );
}

function nombrePareja(pair: StandingRow["pair"]): string {
  if (!pair) {
    return "?";
  }

  const nombre1 = pair.player1
    ? `${pair.player1.nombre} ${pair.player1.apellidos}`
    : "?";

  const nombre2 = pair.player2
    ? ` / ${pair.player2.nombre} ${pair.player2.apellidos}`
    : "";

  return `${nombre1}${nombre2}`;
}
