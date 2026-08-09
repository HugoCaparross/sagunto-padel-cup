// Ruta: src/app/(public)/torneo/[slug]/quiniela/page.tsx
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import QuinielaCard from "@/components/QuinielaCard";

type PlayerName = { nombre: string; apellidos: string } | null;
type MatchRow = {
  id: string;
  pair_1_id: string;
  pair_2_id: string;
  pair1: { player1: PlayerName; player2: PlayerName } | null;
  pair2: { player1: PlayerName; player2: PlayerName } | null;
};

function nombre(p: MatchRow["pair1"]) {
  if (!p) return "?";
  const n1 = p.player1 ? `${p.player1.nombre} ${p.player1.apellidos}` : "?";
  const n2 = p.player2 ? ` / ${p.player2.nombre} ${p.player2.apellidos}` : "";
  return n1 + n2;
}

export default async function QuinielaPage({
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: player } = user
    ? await supabase.from("players").select("id").eq("auth_user_id", user.id).single()
    : { data: null };

  const { data: partidos } = await supabase
    .from("matches")
    .select(
      "id, pair_1_id, pair_2_id, pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))"
    )
    .eq("tournament_id", torneo.id)
    .eq("estado", "pendiente")
    .not("pair_1_id", "is", null)
    .not("pair_2_id", "is", null)
    .returns<MatchRow[]>();

  const { data: misVotos } = player
    ? await supabase
        .from("predicciones")
        .select("match_id, pareja_predicha_id")
        .eq("player_id", player.id)
    : { data: null };

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Quiniela</h1>
      <p className="text-navy/70 mb-8">
        {torneo.nombre} — vota quién crees que gana cada cruce
      </p>

      {!user && (
        <p className="rounded-card bg-navy/5 p-5 mb-6 text-sm">
          Inicia sesión para poder votar.
        </p>
      )}

      <div className="space-y-3">
        {partidos?.map((p) => (
          <QuinielaCard
            key={p.id}
            slug={slug}
            matchId={p.id}
            pareja1={{ id: p.pair_1_id, nombre: nombre(p.pair1) }}
            pareja2={{ id: p.pair_2_id, nombre: nombre(p.pair2) }}
            votoInicial={
              misVotos?.find((v) => v.match_id === p.id)?.pareja_predicha_id ?? null
            }
          />
        ))}
      </div>

      {!partidos?.length && (
        <p className="text-navy/70">No hay partidos pendientes de pronóstico ahora mismo.</p>
      )}
    </main>
  );
}