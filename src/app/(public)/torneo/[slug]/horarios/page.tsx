// Ruta: src/app/(public)/torneo/[slug]/horarios/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type PlayerName = { nombre: string; apellidos: string } | null;
type MatchRow = {
  id: string;
  pista: string | null;
  estado: string;
  categorias: { nombre: string } | null;
  pair1: { player1: PlayerName; player2: PlayerName } | null;
  pair2: { player1: PlayerName; player2: PlayerName } | null;
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Por jugar",
  en_juego: "En juego",
  finalizado: "Finalizado",
};

function nombrePareja(p: MatchRow["pair1"]) {
  if (!p) return "Por determinar";
  const n1 = p.player1 ? `${p.player1.nombre} ${p.player1.apellidos}` : "?";
  const n2 = p.player2 ? ` / ${p.player2.nombre} ${p.player2.apellidos}` : "";
  return n1 + n2;
}

export default async function HorariosPage({
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

  const { data: partidos } = await supabase
    .from("matches")
    .select(
      "id, pista, estado, categorias:categories(nombre), pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))"
    )
    .eq("tournament_id", torneo.id)
    .not("pair_1_id", "is", null)
    .not("pair_2_id", "is", null)
    .order("pista")
    .returns<MatchRow[]>();

  const porPista = new Map<string, MatchRow[]>();
  partidos?.forEach((p) => {
    const key = p.pista ?? "Sin pista asignada";
    if (!porPista.has(key)) porPista.set(key, []);
    porPista.get(key)!.push(p);
  });

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Horarios</h1>
      <p className="text-navy/70 mb-8">{torneo.nombre}</p>

      {Array.from(porPista.entries()).map(([pista, lista]) => (
        <div key={pista} className="mb-6">
          <h2 className="font-display text-lg mb-2">{pista}</h2>
          <ul className="space-y-2">
            {lista.map((p) => (
              <li
                key={p.id}
                className="rounded-card bg-navy/5 px-4 py-3 flex justify-between items-center text-sm"
              >
                <span>
                  <span className="text-sage uppercase text-xs mr-2">
                    {p.categorias?.nombre}
                  </span>
                  {nombrePareja(p.pair1)} vs {nombrePareja(p.pair2)}
                </span>
                <span className="text-navy/60">{ESTADO_LABEL[p.estado]}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {!partidos?.length && (
        <p className="text-navy/70">Los horarios aún no están publicados.</p>
      )}
    </main>
  );
}