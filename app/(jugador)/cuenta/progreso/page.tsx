import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cargarPuntosJugador, type PuntoJugador } from "@/lib/cuenta/cargar";
import {
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_CUADRO,
  ETIQUETAS_RONDA,
  RONDAS,
} from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";
import { usuarioActual } from "@/lib/auth/organizador";
import { estadisticasHistoricas, progresoHistorico } from "@/lib/xp/cargar";

export const metadata: Metadata = { title: "Mi progreso" };

export default async function PaginaProgreso() {
  const userId = await usuarioActual();
  if (!userId) redirect("/login");

  const [progreso, estadisticas, puntos] = await Promise.all([
    progresoHistorico(userId),
    estadisticasHistoricas(userId),
    cargarPuntosJugador(userId),
  ]);

  // Mejor resultado: la ronda más alta; en empate, la de cuadro de mayor nivel (oro antes que plata)
  const mejor = puntos.reduce<PuntoJugador | null>((m, p) => {
    if (!m) return p;
    const r = RONDAS.indexOf(p.ronda) - RONDAS.indexOf(m.ronda);
    if (r < 0) return p;
    if (r === 0 && ["oro", "plata", "bronce"].indexOf(p.cuadro) < ["oro", "plata", "bronce"].indexOf(m.cuadro)) return p;
    return m;
  }, null);

  const tarjetas = [
    { etiqueta: "Puntos históricos", valor: estadisticas.puntosHistoricos },
    { etiqueta: "Pruebas jugadas", valor: estadisticas.pruebasJugadas },
    { etiqueta: "Partidos", valor: estadisticas.partidos },
    { etiqueta: "% de victorias", valor: `${estadisticas.porcentajeVictorias}%` },
  ];

  return (
    <main className="container space-y-8 py-10">
      <header className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold">Mi progreso</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Nivel {progreso.nivel} · {progreso.tier}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
          <div
            className="h-full rounded-full bg-[var(--color-sage)]"
            style={{ width: `${Math.round(progreso.progreso * 100)}%` }}
          />
        </div>
        <p className="text-sm text-[var(--color-muted)]">
          {progreso.esMaximo
            ? "Nivel máximo alcanzado"
            : `${progreso.xpFaltante} XP para el nivel ${progreso.nivel + 1}`}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.etiqueta} className="rounded-xl bg-white p-4 ring-1 ring-[var(--color-border)]">
            <p className="text-xs text-[var(--color-muted)]">{t.etiqueta}</p>
            <p className="mt-1 text-2xl font-semibold">{t.valor}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl bg-white p-5 ring-1 ring-[var(--color-border)]">
        <h2 className="font-semibold">Mejor resultado</h2>
        <p className="mt-1 text-sm">
          {mejor
            ? `${ETIQUETAS_RONDA[mejor.ronda]} en ${ETIQUETAS_CUADRO[mejor.cuadro]} (${ETIQUETAS_CATEGORIA[mejor.categoria]}) · ${mejor.prueba}`
            : "Todavía no tienes resultados publicados."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Historial de puntos</h2>

        {puntos.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Cuando se publiquen tus resultados aparecerán aquí.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface)] text-left text-xs uppercase text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-2">Prueba</th>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Categoría</th>
                  <th className="px-4 py-2">Cuadro</th>
                  <th className="px-4 py-2">Resultado</th>
                  <th className="px-4 py-2 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {puntos.map((p, i) => (
                  <tr key={i} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-2">{p.prueba}</td>
                    <td className="px-4 py-2">{fechaCorta(p.fecha)}</td>
                    <td className="px-4 py-2">{ETIQUETAS_CATEGORIA[p.categoria]}</td>
                    <td className="px-4 py-2">{ETIQUETAS_CUADRO[p.cuadro]}</td>
                    <td className="px-4 py-2">{ETIQUETAS_RONDA[p.ronda]}</td>
                    <td className="px-4 py-2 text-right font-medium">{p.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}