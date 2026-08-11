// Ruta: src/app/(admin)/admin/torneos/[id]/horarios/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import HorariosTable from "@/components/admin/HorariosTable";
import { notFound } from "next/navigation";

type PlayerName = { nombre: string; apellidos: string } | null;
type MatchRow = {
  id: string;
  pista: string | null;
  hora_programada: string | null;
  pair1: { player1: PlayerName; player2: PlayerName } | null;
  pair2: { player1: PlayerName; player2: PlayerName } | null;
};

function nombrePareja(p: MatchRow["pair1"]) {
  if (!p) return "?";
  const n1 = p.player1 ? `${p.player1.nombre} ${p.player1.apellidos}` : "?";
  const n2 = p.player2 ? ` / ${p.player2.nombre} ${p.player2.apellidos}` : "";
  return n1 + n2;
}

export default async function AdminHorariosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: torneo } = await admin.from("tournaments").select("nombre").eq("id", id).single();
  if (!torneo) notFound();

  const { data: partidos } = await admin
    .from("matches")
    .select(
      "id, pista, hora_programada, pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))"
    )
    .eq("tournament_id", id)
    .not("pair_1_id", "is", null)
    .not("pair_2_id", "is", null)
    .order("hora_programada")
    .returns<MatchRow[]>();

  const filas = (partidos ?? []).map((p) => ({
    id: p.id,
    pista: p.pista ?? "",
    horaProgramada: p.hora_programada ? p.hora_programada.slice(0, 16) : "",
    jugadores: `${nombrePareja(p.pair1)} vs ${nombrePareja(p.pair2)}`,
  }));

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Horarios</h1>
      <p className="text-offwhite/60 mb-8">{torneo.nombre}</p>
      <HorariosTable torneoId={id} filas={filas} />
    </main>
  );
}