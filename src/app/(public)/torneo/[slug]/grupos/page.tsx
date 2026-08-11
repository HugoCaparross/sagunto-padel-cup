// Ruta: src/app/(public)/torneo/[slug]/grupos/page.tsx — sustituye entero al archivo actual
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ordenarClasificacionGrupo, type Standing } from "@/lib/grupos";

type PlayerName = { nombre: string; apellidos: string } | null;
type StandingRow = Standing & {
  group_id: string;
  pair: { player1: PlayerName; player2: PlayerName } | null;
};

function nombrePareja(p: StandingRow["pair"]) {
  if (!p) return "?";
  const n1 = p.player1 ? `${p.player1.nombre} ${p.player1.apellidos}` : "?";
  const n2 = p.player2 ? ` / ${p.player2.nombre} ${p.player2.apellidos}` : "";
  return n1 + n2;
}

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

  if (!torneo) notFound();

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
      "group_id, pair_id, puntos, victorias, derrotas, sets_favor, sets_contra, juegos_favor, juegos_contra, pair:pairs(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))"
    )
    .returns<StandingRow[]>();

  const { data: partidos } = await supabase
    .from("matches")
    .select("group_id, pair_1_id, pair_2_id, resultado_json")
    .eq("tournament_id", torneo.id)
    .eq("fase", "grupos")
    .eq("estado", "finalizado");

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Clasificación de grupos</h1>
      <p className="text-navy/70 mb-8">{torneo.nombre}</p>

      {categorias?.map((cat) => (
        <div key={cat.categoria_id} className="mb-10">
          <h2 className="font-display text-xl mb-3">
            {(cat.categories as unknown as { nombre: string })?.nombre}
          </h2>

          {grupos
            ?.filter((g) => g.categoria_id === cat.categoria_id)
            .map((g) => {
              const filasGrupo = standings?.filter((s) => s.group_id === g.id) ?? [];
              const partidosGrupo = partidos?.filter((p) => p.group_id === g.id) ?? [];
              const orden = ordenarClasificacionGrupo(filasGrupo, partidosGrupo);

              return (
                <div key={g.id} className="mb-4 overflow-x-auto">
                  <p className="font-semibold mb-2">{g.nombre}</p>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-left text-navy/60 border-b border-navy/10">
                        <th className="py-2">Pareja</th>
                        <th className="py-2 text-center">Pts</th>
                        <th className="py-2 text-center">V-D</th>
                        <th className="py-2 text-center">Sets</th>
                        <th className="py-2 text-center">Juegos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orden.map((f, i) => {
                        const fila = filasGrupo.find((s) => s.pair_id === f.pair_id);
                        return (
                          <tr key={i} className="border-b border-navy/5">
                            <td className="py-2">{nombrePareja((fila as StandingRow)?.pair)}</td>
                            <td className="py-2 text-center font-semibold">{f.puntos}</td>
                            <td className="py-2 text-center">
                              {(fila as StandingRow)?.victorias}-{(fila as StandingRow)?.derrotas}
                            </td>
                            <td className="py-2 text-center">
                              {f.sets_favor}-{f.sets_contra}
                            </td>
                            <td className="py-2 text-center">
                              {f.juegos_favor}-{f.juegos_contra}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
        </div>
      ))}

      {!grupos?.length && (
        <p className="text-navy/70">Aún no se ha generado el sorteo.</p>
      )}
    </main>
  );
}