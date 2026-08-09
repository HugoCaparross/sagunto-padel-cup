// Ruta: src/app/(public)/master-final/page.tsx
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Master Final" };

type PuntoRow = {
  player_id: string;
  puntos_obtenidos: number;
  tournament_id: string;
  categoria_id: string;
  players: { nombre: string; apellidos: string } | null;
};

export default async function MasterFinalPage() {
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: categorias } = await supabase
    .from("categories")
    .select("id, nombre")
    .order("nivel_orden");

  const { data: puntos } = await supabase
    .from("ranking_points")
    .select("player_id, puntos_obtenidos, tournament_id, categoria_id, players(nombre, apellidos)")
    .gte("fecha_caducidad", hoy)
    .returns<PuntoRow[]>();

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Master Final</h1>
      <p className="text-navy/70 mb-8">
        Las 6 mejores parejas del ranking de cada categoría, con mínimo 2
        torneos jugados, clasifican directas a la fase final del Master.
      </p>

      {categorias?.map((cat) => {
        const deCategoria = puntos?.filter((p) => p.categoria_id === cat.id) ?? [];
        const acumulado = new Map<string, { nombre: string; puntos: number; torneos: Set<string> }>();

        deCategoria.forEach((p) => {
          if (!p.players) return;
          const key = p.player_id;
          const actual = acumulado.get(key);
          if (actual) {
            actual.puntos += p.puntos_obtenidos;
            actual.torneos.add(p.tournament_id);
          } else {
            acumulado.set(key, {
              nombre: `${p.players.nombre} ${p.players.apellidos}`,
              puntos: p.puntos_obtenidos,
              torneos: new Set([p.tournament_id]),
            });
          }
        });

        const lista = Array.from(acumulado.values()).sort((a, b) => b.puntos - a.puntos);
        const puntoCorte = lista[5]?.puntos ?? 0;

        return (
          <div key={cat.id} className="mb-10">
            <h2 className="font-display text-xl mb-3">{cat.nombre}</h2>
            <ul className="space-y-2">
              {lista.map((j, i) => {
                const clasificado = i < 6 && j.torneos.size >= 2;
                return (
                  <li
                    key={i}
                    className={`rounded-card px-5 py-3 flex justify-between items-center ${
                      clasificado ? "bg-sage/20 border border-sage" : "bg-navy/5"
                    }`}
                  >
                    <span>
                      #{i + 1} {j.nombre}{" "}
                      {j.torneos.size < 2 && (
                        <span className="text-xs text-navy/50">
                          ({j.torneos.size}/2 torneos)
                        </span>
                      )}
                    </span>
                    <span className="text-sm">
                      {j.puntos} pts
                      {!clasificado && i >= 6 && (
                        <span className="text-navy/50 text-xs ml-2">
                          (-{puntoCorte - j.puntos} para clasificar)
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            {!lista.length && (
              <p className="text-navy/70 text-sm">Aún no hay ranking en esta categoría.</p>
            )}
          </div>
        );
      })}
    </main>
  );
}