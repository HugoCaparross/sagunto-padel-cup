import type { Metadata } from "next";
import SimuladorPuntos from "@/components/puntos/SimuladorPuntos";
import {
  CATEGORIAS,
  CUADROS,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_CUADRO,
  ETIQUETAS_RONDA,
  RONDAS,
} from "@/lib/constantes";
import { ESCALA } from "@/lib/puntos/escala";

export const metadata: Metadata = { title: "Sistema de puntos" };

export default function PaginaPuntos() {
  return (
    <main className="container space-y-16 py-12">
      <header className="max-w-2xl space-y-4">
        <h1 className="heading-font text-6xl">Sistema de puntos</h1>
        <p className="text-lg text-[#68737D]">
          Los puntos se asignan a cada jugador según la categoría, el cuadro y la ronda alcanzada. Cada
          resultado cuenta durante 12 meses.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="heading-font text-4xl">Tabla de puntos</h2>
        <p className="text-sm text-[#68737D]">Puntos por jugador.</p>

        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[#D5D9DC]">
          <table className="w-full text-sm">
            <thead className="bg-[#F4F5F4] text-left text-xs uppercase text-[#68737D]">
              <tr>
                <th rowSpan={2} className="px-4 py-2 align-bottom">
                  Ronda
                </th>
                {CATEGORIAS.map((c) => (
                  <th
                    key={c}
                    colSpan={CUADROS.length}
                    className="border-l border-[#D5D9DC] px-4 py-2 text-center"
                  >
                    {ETIQUETAS_CATEGORIA[c]}
                  </th>
                ))}
              </tr>
              <tr>
                {CATEGORIAS.flatMap((c) =>
                  CUADROS.map((q) => (
                    <th
                      key={`${c}-${q}`}
                      className={`px-3 py-2 text-right ${q === "oro" ? "border-l border-[#D5D9DC]" : ""}`}
                    >
                      {ETIQUETAS_CUADRO[q]}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {RONDAS.map((r) => (
                <tr key={r} className="border-t border-[#D5D9DC]">
                  <td className="px-4 py-2 font-medium">{ETIQUETAS_RONDA[r]}</td>
                  {CATEGORIAS.flatMap((c) =>
                    CUADROS.map((q) => (
                      <td
                        key={`${r}-${c}-${q}`}
                        className={`px-3 py-2 text-right tabular-nums ${q === "oro" ? "border-l border-[#D5D9DC]" : ""}`}
                      >
                        {ESCALA[r][c][q]}
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="heading-font text-4xl">Simulador</h2>
          <p className="text-sm text-[#68737D]">
            Elige una categoría, un cuadro y una ronda para ver los puntos que corresponden.
          </p>
          <SimuladorPuntos />
        </div>

        <div className="space-y-4 text-sm">
          <h2 className="heading-font text-4xl">Cómo se calcula</h2>
          <p>
            Cada jugador suma los puntos de cada prueba en la que haya participado. Los puntos
            dependen de la categoría en la que juega, del cuadro en el que termina y de la ronda que
            alcanza.
          </p>
          <p>
            Un resultado caduca 12 meses después de la fecha de la prueba. Por eso el ranking refleja
            la forma actual de cada jugador.
          </p>
          <p>
            El nivel del jugador es distinto: se calcula con sus puntos históricos y no caduca.
          </p>
        </div>
      </section>
    </main>
  );
}