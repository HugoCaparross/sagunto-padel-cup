// Ruta: src/app/(public)/torneo/[slug]/resultados/page.tsx — sustituye entero al archivo actual
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type MatchRow = {
  id: string;
  fase: string;
  tramo: string | null;
  resultado_json: { sets: { juegos_pair1: number; juegos_pair2: number }[] } | null;
  categorias: { nombre: string } | null;
  pair1: {
    player1: { nombre: string; apellidos: string } | null;
    player2: { nombre: string; apellidos: string } | null;
  } | null;
  pair2: {
    player1: { nombre: string; apellidos: string } | null;
    player2: { nombre: string; apellidos: string } | null;
  } | null;
};

function nombrePareja(p: MatchRow["pair1"]) {
  if (!p) return "?";
  const n1 = p.player1 ? `${p.player1.nombre} ${p.player1.apellidos}` : "?";
  const n2 = p.player2 ? ` / ${p.player2.nombre} ${p.player2.apellidos}` : "";
  return n1 + n2;
}

export default async function ResultadosPublicosPage({
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
      "id, fase, tramo, resultado_json, categorias:categories(nombre), pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))"
    )
    .eq("tournament_id", torneo.id)
    .eq("estado", "finalizado")
    .order("fecha_modificacion", { ascending: false })
    .returns<MatchRow[]>();

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Resultados</h1>
      <p className="text-navy/70 mb-8">{torneo.nombre}</p>

      <ul className="space-y-2">
        {partidos?.map((p) => (
          <li key={p.id} className="rounded-card bg-navy/5 px-5 py-3">
            <p className="text-xs text-sage uppercase mb-1">
              {p.categorias?.nombre} · {p.tramo ? `${p.tramo} · ${p.fase}` : "grupos"}
            </p>
            <p className="text-sm">
              {nombrePareja(p.pair1)} <span className="text-navy/50">vs</span>{" "}
              {nombrePareja(p.pair2)}
            </p>
            <p className="font-semibold mt-1">
              {p.resultado_json?.sets
                ?.map((s) => `${s.juegos_pair1}-${s.juegos_pair2}`)
                .join(", ") ?? "bye"}
            </p>
          </li>
        ))}
      </ul>

      {!partidos?.length && (
        <p className="text-navy/70">Aún no hay resultados.</p>
      )}
    </main>
  );
}