import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Master Final",
  description:
    "Consulta cómo funciona el Master Final de Sagunto Padel Cup y sigue el ranking individual de cada categoría.",
  alternates: { canonical: "/master-final" },
};

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
        El Master Final cierra la temporada de Sagunto Padel Cup. Todos los
        jugadores que cumplan los requisitos de la temporada pueden participar;
        el ranking individual determina el acceso y la posición.
      </p>

      <section className="rounded-card bg-sage/15 border border-sage/40 p-5 mb-10">
        <h2 className="font-display text-xl mb-2">La ventaja del Top 4</h2>
        <p className="text-sm text-navy/80">
          Las 4 mejores parejas de cada categoría comienzan directamente en el
          cuadro final. El resto de parejas elegibles disputa la fase previa.
        </p>
        <Link href="/circuito" className="btn-tertiary inline-block mt-3">
          Consultar cómo funciona el circuito
        </Link>
      </section>

      <h2 className="font-display text-xl mb-2">Ranking individual actual</h2>
      <p className="text-sm text-navy/70 mb-5">
        Esta clasificación muestra los puntos individuales vigentes. La
        composición de parejas y el cuadro del Master se publicarán cuando la
        organización cierre la fase correspondiente.
      </p>

      {categorias?.map((cat) => {
        const deCategoria = puntos?.filter((p) => p.categoria_id === cat.id) ?? [];
        const acumulado = new Map<string, { nombre: string; puntos: number; torneos: Set<string> }>();

        deCategoria.forEach((p) => {
          if (!p.players) return;
          const actual = acumulado.get(p.player_id);
          if (actual) {
            actual.puntos += p.puntos_obtenidos;
            actual.torneos.add(p.tournament_id);
          } else {
            acumulado.set(p.player_id, {
              nombre: `${p.players.nombre} ${p.players.apellidos}`,
              puntos: p.puntos_obtenidos,
              torneos: new Set([p.tournament_id]),
            });
          }
        });

        const lista = Array.from(acumulado.values()).sort((a, b) => b.puntos - a.puntos);

        return (
          <section key={cat.id} className="mb-10">
            <h3 className="font-display text-xl mb-3">{cat.nombre}</h3>
            <ol className="space-y-2">
              {lista.map((j, i) => (
                <li
                  key={`${j.nombre}-${i}`}
                  className="rounded-card px-5 py-3 flex justify-between items-center bg-navy/5"
                >
                  <span>
                    #{i + 1} {j.nombre}
                    {j.torneos.size < 2 && (
                      <span className="text-xs text-navy/50"> ({j.torneos.size} torneo{j.torneos.size === 1 ? "" : "s"})</span>
                    )}
                  </span>
                  <span className="text-sm">{j.puntos} pts</span>
                </li>
              ))}
            </ol>
            {!lista.length && (
              <p className="text-navy/70 text-sm">Aún no hay ranking en esta categoría.</p>
            )}
          </section>
        );
      })}
    </main>
  );
}
