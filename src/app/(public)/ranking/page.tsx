// Ruta: src/app/(public)/ranking/page.tsx
import { createClient } from "@/lib/supabase/server";

type PuntoRow = {
  player_id: string;
  puntos_obtenidos: number;
  players: { nombre: string; apellidos: string; categoria_actual_id: string | null } | null;
};

export const metadata = { title: "Ranking" };

export default async function RankingPage() {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  // Ranking móvil: solo cuentan los puntos aún no caducados (últimos 12 meses)
  const { data: puntos } = await supabase
    .from("ranking_points")
    .select("player_id, puntos_obtenidos, players(nombre, apellidos, categoria_actual_id)")
    .gte("fecha_caducidad", hoy)
    .returns<PuntoRow[]>();

  const acumulado = new Map<
    string,
    { nombre: string; puntos: number }
  >();

  puntos?.forEach((p) => {
    if (!p.players) return;
    const nombre = `${p.players.nombre} ${p.players.apellidos}`;
    const actual = acumulado.get(p.player_id);
    if (actual) actual.puntos += p.puntos_obtenidos;
    else acumulado.set(p.player_id, { nombre, puntos: p.puntos_obtenidos });
  });

  const ranking = Array.from(acumulado.values()).sort((a, b) => b.puntos - a.puntos);

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Ranking</h1>
      <p className="text-navy/70 mb-8">
        Ranking móvil de los últimos 12 meses.
      </p>

      <ol className="space-y-2">
        {ranking.map((r, i) => (
          <li
            key={i}
            className="flex justify-between items-center rounded-card bg-navy/5 px-5 py-3"
          >
            <span>
              <span className="text-sage font-display mr-3">#{i + 1}</span>
              {r.nombre}
            </span>
            <span className="font-semibold">{r.puntos} pts</span>
          </li>
        ))}
      </ol>

      {!ranking.length && (
        <p className="text-navy/70">Todavía no hay puntos de ranking.</p>
      )}
    </main>
  );
}