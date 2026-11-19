import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Enfrentamientos from "@/components/jugadores/Enfrentamientos";
import SimuladorJugador from "@/components/jugadores/SimuladorJugador";
import { usuarioActual } from "@/lib/auth/organizador";
import {
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_CUADRO,
  ETIQUETAS_RONDA,
} from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";
import { cargarFichaPublica, listarJugadoresPublicos } from "@/lib/jugadores/publico";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const usuario = await usuarioActual();
  const ficha = await cargarFichaPublica(slug, usuario);
  return { title: ficha ? ficha.nombre : "Jugador" };
}

export default async function PaginaJugador({ params }: Props) {
  const { slug } = await params;
  const usuario = await usuarioActual();

  const ficha = await cargarFichaPublica(slug, usuario);
  if (!ficha) notFound();

  const candidatos = await listarJugadoresPublicos();
  const otros = candidatos.filter((j) => j.id !== ficha.id);

  const datos = ficha.datosDeportivos
    ? Object.entries(ficha.datosDeportivos).flatMap(([clave, valor]) => {
      if (clave === "otros" && valor && typeof valor === "object") {
        return Object.entries(valor as Record<string, string>);
      }
      if (valor === null || valor === "" || typeof valor === "object") return [];
      return [[clave, String(valor)] as [string, string]];
    })
    : [];

  const { estadisticas, nivel } = ficha;

  return (
    <main className="container space-y-10 py-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-[#68737D]">Jugador</p>
            <h1 className="heading-font text-5xl">{ficha.nombre}</h1>
            {!ficha.visible && (
              <p className="text-sm text-[#68737D]">Perfil visible solo para ti.</p>
            )}
          </div>
          <div className="text-right">
            <p className="heading-font text-4xl">Nivel {nivel.nivel}</p>
            <p className="text-sm text-[#68737D]">{nivel.tier}</p>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#F4F5F4]">
          <div
            className="h-full rounded-full bg-[#A7C4A0]"
            style={{ width: `${Math.round(nivel.progreso * 100)}%` }}
          />
        </div>
        <p className="text-sm text-[#68737D]">
          {nivel.esMaximo ? "Nivel máximo" : `${nivel.xpFaltante} XP para el nivel ${nivel.nivel + 1}`}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { etiqueta: "Puntos", valor: estadisticas.puntosHistoricos },
          { etiqueta: "Pruebas", valor: estadisticas.pruebasJugadas },
          { etiqueta: "Partidos", valor: estadisticas.partidos },
          { etiqueta: "% victorias", valor: `${estadisticas.porcentajeVictorias}%` },
        ].map((t) => (
          <div key={t.etiqueta} className="rounded-xl bg-white p-4 ring-1 ring-[#D5D9DC]">
            <p className="text-xs text-[#68737D]">{t.etiqueta}</p>
            <p className="mt-1 text-2xl font-semibold">{t.valor}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="font-semibold">Historial de pruebas</h2>
            {ficha.pruebas.length === 0 ? (
              <p className="text-sm text-[#68737D]">Todavía no hay resultados publicados.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[#D5D9DC]">
                <table className="w-full text-sm">
                  <thead className="bg-[#F4F5F4] text-left text-xs uppercase text-[#68737D]">
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
                    {ficha.pruebas.map((p, i) => (
                      <tr key={i} className="border-t border-[#D5D9DC]">
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

          <section className="space-y-3">
            <h2 className="font-semibold">Enfrentamientos</h2>
            <Enfrentamientos
              jugadorId={ficha.id}
              jugadorNombre={ficha.nombre}
              candidatos={otros}
            />
          </section>
        </div>

        <aside className="space-y-8">
          <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
            <h2 className="font-semibold">Posiciones actuales</h2>
            {ficha.posiciones.length === 0 ? (
              <p className="text-sm text-[#68737D]">Sin posición en el ranking.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {ficha.posiciones.map((p) => (
                  <li key={p.categoria} className="flex justify-between">
                    <span>{ETIQUETAS_CATEGORIA[p.categoria]}</span>
                    <span className="font-medium">
                      {p.posicion}.º · {p.puntos} pts
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/ranking" className="text-sm underline">
              Ver ranking
            </Link>
          </section>

          {datos.length > 0 && (
            <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
              <h2 className="font-semibold">Datos deportivos</h2>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {datos.map(([clave, valor]) => (
                  <div key={clave} className="contents">
                    <dt className="text-[#68737D]">{clave}</dt>
                    <dd className="text-right">{valor}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {ficha.esPropio && (
            <section className="space-y-3 rounded-xl bg-white p-5 ring-1 ring-[#D5D9DC]">
              <h2 className="font-semibold">Simulador</h2>
              <SimuladorJugador />
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}