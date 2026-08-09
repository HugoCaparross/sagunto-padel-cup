// Ruta: src/app/(public)/comparar/[id1]/[id2]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { obtenerNivelJugador } from "@/lib/gamification";
import { notFound } from "next/navigation";

async function statsJugador(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data: jugador } = await supabase
    .from("players")
    .select("nombre, apellidos, categories(nombre)")
    .eq("id", id)
    .single();
  if (!jugador) return null;

  const hoy = new Date().toISOString().slice(0, 10);
  const { data: puntos } = await supabase
    .from("ranking_points")
    .select("puntos_obtenidos, tournament_id")
    .eq("player_id", id)
    .gte("fecha_caducidad", hoy);

  const totalPuntos = puntos?.reduce((s, p) => s + p.puntos_obtenidos, 0) ?? 0;
  const torneosJugados = new Set(puntos?.map((p) => p.tournament_id)).size;

  const { data: titulos } = await supabase
    .from("ranking_points")
    .select("id")
    .eq("player_id", id)
    .like("ronda_alcanzada", "campeon_%");

  const nivel = await obtenerNivelJugador(supabase, id);

  return {
    nombre: `${jugador.nombre} ${jugador.apellidos}`,
    categoria: (jugador.categories as unknown as { nombre: string })?.nombre,
    puntos: totalPuntos,
    torneos: torneosJugados,
    titulos: titulos?.length ?? 0,
    nivel: nivel.etiqueta,
  };
}

export default async function CompararDetallePage({
  params,
}: {
  params: Promise<{ id1: string; id2: string }>;
}) {
  const { id1, id2 } = await params;
  const supabase = await createClient();

  const [j1, j2] = await Promise.all([
    statsJugador(supabase, id1),
    statsJugador(supabase, id2),
  ]);

  if (!j1 || !j2) notFound();

  const filas = [
    { label: "Categoría", v1: j1.categoria, v2: j2.categoria },
    { label: "Nivel", v1: j1.nivel, v2: j2.nivel },
    { label: "Puntos de ranking", v1: j1.puntos, v2: j2.puntos },
    { label: "Torneos jugados (12 meses)", v1: j1.torneos, v2: j2.torneos },
    { label: "Títulos", v1: j1.titulos, v2: j2.titulos },
  ];

  return (
    <main className="max-w-xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8 text-center">
        {j1.nombre} <span className="text-navy/40">vs</span> {j2.nombre}
      </h1>

      <div className="space-y-2">
        {filas.map((f, i) => {
          const numerico = typeof f.v1 === "number" && typeof f.v2 === "number";
          const gana1 = numerico && (f.v1 as number) > (f.v2 as number);
          const gana2 = numerico && (f.v2 as number) > (f.v1 as number);
          return (
            <div key={i} className="grid grid-cols-3 items-center rounded-card bg-navy/5 px-4 py-3">
              <span className={`text-right pr-3 ${gana1 ? "font-bold text-coral" : ""}`}>{f.v1}</span>
              <span className="text-center text-xs text-navy/50 uppercase">{f.label}</span>
              <span className={`text-left pl-3 ${gana2 ? "font-bold text-coral" : ""}`}>{f.v2}</span>
            </div>
          );
        })}
      </div>
    </main>
  );
}