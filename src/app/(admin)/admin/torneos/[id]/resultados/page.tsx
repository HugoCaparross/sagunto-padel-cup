// Ruta: src/app/(admin)/admin/torneos/[id]/resultados/page.tsx — sustituye entero al archivo actual
import { createAdminClient } from "@/lib/supabase/admin";
import ResultadoForm from "@/components/admin/ResultadoForm";
import { notFound } from "next/navigation";

type MatchRow = {
  id: string;
  pista: string | null;
  estado: string;
  fase: string;
  tramo: string | null;
  resultado_json: { sets: { juegos_pair1: number; juegos_pair2: number }[] } | null;
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

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: torneo } = await admin
    .from("tournaments")
    .select("nombre")
    .eq("id", id)
    .single();

  if (!torneo) notFound();

  const { data: partidos } = await admin
    .from("matches")
    .select(
      "id, pista, estado, fase, tramo, resultado_json, pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))"
    )
    .eq("tournament_id", id)
    .order("pista")
    .returns<MatchRow[]>();

  // Solo partidos con las dos parejas ya conocidas están listos para jugarse
  const pendientes = partidos?.filter((p) => p.estado === "pendiente" && p.pair1 && p.pair2) ?? [];
  const finalizados = partidos?.filter((p) => p.estado === "finalizado") ?? [];

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Resultados</h1>
      <p className="text-offwhite/60 mb-8">{torneo.nombre}</p>

      <h2 className="font-display text-xl mb-3">Pendientes</h2>
      <div className="space-y-3 mb-10">
        {pendientes.map((p) => (
          <div key={p.id}>
            <p className="text-xs text-sage mb-1">
              {p.tramo ? `${p.tramo} · ${p.fase}` : p.pista}
            </p>
            <ResultadoForm
              torneoId={id}
              matchId={p.id}
              nombrePair1={nombrePareja(p.pair1)}
              nombrePair2={nombrePareja(p.pair2)}
            />
          </div>
        ))}
        {!pendientes.length && (
          <p className="text-offwhite/60 text-sm">No hay partidos pendientes.</p>
        )}
      </div>

      <h2 className="font-display text-xl mb-3">Finalizados</h2>
      <ul className="space-y-2">
        {finalizados.map((p) => (
          <li key={p.id} className="rounded-card bg-navy-light px-4 py-3 text-sm">
            {nombrePareja(p.pair1)} vs {nombrePareja(p.pair2)} —{" "}
            {p.resultado_json?.sets
              ?.map((s) => `${s.juegos_pair1}-${s.juegos_pair2}`)
              .join(", ") ?? "bye"}
          </li>
        ))}
      </ul>
    </main>
  );
}