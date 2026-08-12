// Ruta: src/app/(public)/circuito/page.tsx

export const metadata = {
  title: "El Circuito",
  description:
    "Conoce el formato de competición, categorías, sistema de puntos, ranking individual y Master Final de Sagunto Padel Cup.",
};

const TABLA = [
  { r: "Campeón Oro", p: [100, 82, 67, 55] },
  { r: "Subcampeón Oro", p: [88, 72, 59, 48] },
  { r: "Semifinalista Oro", p: [78, 64, 52, 43] },
  { r: "Cuartofinalista Oro", p: [70, 57, 47, 38] },
  { r: "Octavofinalista Oro", p: [64, 52, 43, 35] },
  { r: "Campeón Plata", p: [62, 51, 42, 34] },
  { r: "Subcampeón Plata", p: [54, 44, 36, 30] },
  { r: "Semifinalista Plata", p: [48, 39, 32, 26] },
  { r: "Cuartofinalista Plata", p: [44, 36, 29, 24] },
  { r: "Campeón Bronce", p: [42, 34, 28, 22] },
  { r: "Subcampeón Bronce", p: [36, 30, 24, 19] },
  { r: "Semifinalista Bronce", p: [32, 26, 21, 17] },
  { r: "Cuartofinalista Bronce", p: [28, 23, 19, 15] },
  { r: "Participación", p: [12, 10, 8, 6] },
];

export default function CircuitoPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <header className="mb-10">
        <h1 className="font-display text-3xl">El Circuito</h1>
        <p className="mt-3 max-w-3xl leading-7 text-navy/70">
          Sagunto Padel Cup es un circuito amateur de pádel formado por pruebas
          independientes a lo largo de la temporada, con ranking individual y un
          Master Final como cierre competitivo.
        </p>
      </header>

      <nav
        aria-label="Secciones del circuito"
        className="mb-10 flex flex-wrap gap-x-5 gap-y-2 border-y border-navy/10 py-4 text-sm font-semibold"
      >
        <a href="#formato">Formato</a>
        <a href="#categorias">Categorías</a>
        <a href="#puntos">Puntuación</a>
        <a href="#ranking">Ranking</a>
        <a href="#master">Master Final</a>
      </nav>

      <div className="space-y-12">
        <section id="formato" aria-labelledby="formato-title">
          <h2 id="formato-title" className="font-display text-2xl">
            Formato de competición
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-navy/75">
            <li>
              Fase de grupos: 1 set con bola de oro; el empate a 5-5 se resuelve
              con tie-break.
            </li>
            <li>
              Fase final, excepto la final: a 9 juegos con bola de oro; el
              empate a 8-8 se resuelve con tie-break.
            </li>
            <li>
              Final: super tie-break como tercer set, en lugar de un tercer set
              completo.
            </li>
          </ul>
        </section>

        <section id="categorias" aria-labelledby="categorias-title">
          <h2 id="categorias-title" className="font-display text-2xl">
            Categorías
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-navy/75">
            Las categorías son 2ª, 3ª, 4ª e Iniciación. Cada categoría tiene su
            clasificación competitiva independiente.
          </p>
        </section>

        <section id="puntos" aria-labelledby="puntos-title">
          <h2 id="puntos-title" className="font-display text-2xl">
            Sistema de puntos
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-navy/75">
            El ranking es móvil: los puntos de una prueba permanecen dentro de
            la ventana competitiva de 365 días. La puntuación depende de la
            categoría y de la posición alcanzada en Oro, Plata o Bronce.
          </p>

          <div className="mt-5 overflow-x-auto border-y border-navy/10">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">
                Tabla de puntos por resultado y categoría
              </caption>
              <thead>
                <tr className="border-b border-navy/10 text-left">
                  <th scope="col" className="py-3 pr-4">
                    Resultado
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    2ª
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    3ª
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    4ª
                  </th>
                  <th scope="col" className="px-3 py-3 text-center">
                    Iniciación
                  </th>
                </tr>
              </thead>
              <tbody>
                {TABLA.map((fila) => (
                  <tr
                    key={fila.r}
                    className="border-b border-navy/5 last:border-0"
                  >
                    <th scope="row" className="py-2 pr-4 text-left font-medium">
                      {fila.r}
                    </th>
                    {fila.p.map((valor, index) => (
                      <td
                        key={`${fila.r}-${index}`}
                        className="px-3 py-2 text-center tabular-nums"
                      >
                        {valor}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="ranking" aria-labelledby="ranking-title">
          <h2 id="ranking-title" className="font-display text-2xl">
            Ranking individual
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-navy/75">
            El ranking es individual, público y derivado de los resultados y
            reglas de puntuación. Puedes consultar la clasificación general, las
            categorías y la evolución disponible.
          </p>
        </section>

        <section id="master" aria-labelledby="master-title">
          <h2 id="master-title" className="font-display text-2xl">
            Master Final
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-navy/75">
            El Master Final culmina la temporada. La plataforma debe mostrar de
            forma pública los criterios de clasificación, el corte y el estado
            de cada plaza cuando estén definidos.
          </p>
        </section>
      </div>
    </main>
  );
}
