// Ruta: src/app/(public)/torneo/[slug]/horarios/page.tsx — sustituye entero al archivo actual
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ESTADO_PARTIDO, formatearFechaHora } from "@/lib/estados";
import { Clock, MapPin } from "lucide-react";

type PlayerName = { nombre: string; apellidos: string } | null;
type MatchRow = {
  id: string;
  pista: string | null;
  hora_programada: string | null;
  estado: string;
  pair_1_id: string | null;
  pair_2_id: string | null;
  categorias: { nombre: string } | null;
  pair1: { player1: PlayerName; player2: PlayerName } | null;
  pair2: { player1: PlayerName; player2: PlayerName } | null;
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: miPlayer } = user
    ? await supabase.from("players").select("id").eq("auth_user_id", user.id).single()
    : { data: null };

  const { data: partidos } = await supabase
    .from("matches")
    .select(
      "id, pista, hora_programada, estado, pair_1_id, pair_2_id, categorias:categories(nombre), pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))"
    )
    .eq("tournament_id", torneo.id)
    .not("pair_1_id", "is", null)
    .not("pair_2_id", "is", null)
    .order("hora_programada", { ascending: true, nullsFirst: false })
    .returns<MatchRow[]>();

  // Busca el próximo partido real del jugador identificado, comparando
  // por pertenencia a la pareja (vía pair_1_id/pair_2_id + su player id)
  let miPartido: MatchRow | null = null;
  if (miPlayer) {
    const { data: misParejas } = await supabase
      .from("pairs")
      .select("id")
      .eq("tournament_id", torneo.id)
      .or(`player_1_id.eq.${miPlayer.id},player_2_id.eq.${miPlayer.id}`);

    const misParejaIds = misParejas?.map((p) => p.id) ?? [];

    if (misParejaIds.length) {
      const { data } = await supabase
        .from("matches")
        .select(
          "id, pista, hora_programada, estado, pair_1_id, pair_2_id, categorias:categories(nombre), pair1:pairs!matches_pair_1_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos)), pair2:pairs!matches_pair_2_id_fkey(player1:players!pairs_player_1_id_fkey(nombre, apellidos), player2:players!pairs_player_2_id_fkey(nombre, apellidos))"
        )
        .eq("tournament_id", torneo.id)
        .eq("estado", "pendiente")
        .or(`pair_1_id.in.(${misParejaIds.join(",")}),pair_2_id.in.(${misParejaIds.join(",")})`)
        .order("hora_programada")
        .limit(1)
        .maybeSingle<MatchRow>();
      miPartido = data;
    }
  }

  const porFranja = new Map<string, MatchRow[]>();
  partidos?.forEach((p) => {
    const key = p.hora_programada ? formatearFechaHora(p.hora_programada) : "Hora por confirmar";
    if (!porFranja.has(key)) porFranja.set(key, []);
    porFranja.get(key)!.push(p);
  });

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Horarios</h1>
      <p className="text-navy/70 mb-8">{torneo.nombre}</p>

      {miPartido && (
        <div className="card-dark mb-8">
          <p className="text-sage text-xs uppercase mb-2">Tu próximo partido</p>
          <div className="flex items-center gap-4 text-sm mb-1">
            <span className="flex items-center gap-1">
              <Clock size={14} aria-hidden="true" />
              {miPartido.hora_programada
                ? formatearFechaHora(miPartido.hora_programada)
                : "Por confirmar"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} aria-hidden="true" /> {miPartido.pista}
            </span>
          </div>
          <p className="font-semibold">
            {nombrePareja(miPartido.pair1)} vs {nombrePareja(miPartido.pair2)}
          </p>
        </div>
      )}

      {Array.from(porFranja.entries()).map(([franja, lista]) => (
        <div key={franja} className="mb-6">
          <h2 className="font-display text-lg mb-2">{franja}</h2>
          <ul className="space-y-2">
            {lista.map((p) => (
              <li key={p.id} className="card flex justify-between items-center text-sm">
                <span>
                  <span className="text-sage uppercase text-xs mr-2">{p.categorias?.nombre}</span>
                  <span className="flex items-center gap-1 text-navy/50 text-xs mb-1">
                    <MapPin size={12} aria-hidden="true" /> {p.pista}
                  </span>
                  {nombrePareja(p.pair1)} vs {nombrePareja(p.pair2)}
                </span>
                <span className="text-navy/60 text-xs">{ESTADO_PARTIDO[p.estado]}</span>
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