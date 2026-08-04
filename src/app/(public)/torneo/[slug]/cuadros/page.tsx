// Ruta: src/app/(public)/torneo/[slug]/cuadros/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type PlayerName = { nombre: string; apellidos: string } | null;
type MatchRow = {
  id: string;
  fase: string;
  tramo: string | null;
  categoria_id: string;
  estado: string;
  resultado_json: { ganador_id?: string } | null;
  pair1: { player1: PlayerName; player2: PlayerName } | null;
  pair2: { player1: PlayerName; player2: PlayerName } | null;
  pair_1_id: string | null;
  pair_2_id: string | null;
};

function nombrePareja(p: MatchRow["pair1"]) {
  if (!p) return "Por determinar";
  const n1 = p.player1 ? `${p.player1.nombre} ${p.player1.apellidos}` : "?";
  const n2 = p.player2 ? ` / ${p.player2.nombre} ${p.player2.apellidos}` : "";
  return n1 + n2;
}

const ORDEN_FASE = ["octavos", "cuartos", "semis", "final"];

export default async function CuadrosPublicosPage({
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

  const { data: partidos } = await supabase
    .from("matches")
    .select(
      "id, fase, tramo, categoria_id, estado, resultado_json, pair_1_id, pair_2_id, pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))"
    )
    .eq("tournament_id", torneo.id)
    .not("tramo", "is", null)
    .returns<MatchRow[]>();

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Cuadros</h1>
      <p className="text-navy/70 mb-8">{torneo.nombre}</p>

      {categorias?.map((cat) => (
        <div key={cat.categoria_id} className="mb-10">
          <h2 className="font-display text-xl mb-3">
            {(cat.categories as unknown as { nombre: string })?.nombre}
          </h2>

          {(["oro", "plata", "bronce"] as const).map((tramo) => {
            const delTramo = partidos
              ?.filter((p) => p.categoria_id === cat.categoria_id && p.tramo === tramo)
              .sort((a, b) => ORDEN_FASE.indexOf(a.fase) - ORDEN_FASE.indexOf(b.fase));

            if (!delTramo?.length) return null;

            return (
              <div key={tramo} className="mb-4 rounded-card bg-navy/5 p-4">
                <p className="font-semibold capitalize mb-2">{tramo}</p>
                <ul className="text-sm space-y-1">
                  {delTramo.map((p) => {
                    const ganadorId = p.resultado_json?.ganador_id;
                    return (
                      <li key={p.id} className="flex justify-between">
                        <span>
                          <span
                            className={ganadorId === p.pair_1_id ? "font-semibold" : ""}
                          >
                            {nombrePareja(p.pair1)}
                          </span>{" "}
                          <span className="text-navy/40">vs</span>{" "}
                          <span
                            className={ganadorId === p.pair_2_id ? "font-semibold" : ""}
                          >
                            {p.pair_2_id ? nombrePareja(p.pair2) : "Bye"}
                          </span>
                        </span>
                        <span className="text-navy/50 text-xs uppercase">{p.fase}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </main>
  );
}