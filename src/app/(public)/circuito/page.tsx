// Ruta: src/app/(public)/circuito/page.tsx
export const metadata = { title: "El Circuito" };

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
    <main className="max-w-2xl mx-auto px-5 py-12 space-y-10">
      <div>
        <h1 className="font-display text-3xl mb-3">El Circuito</h1>
        <p className="text-navy/70">
          Sagunto Padel Cup es un circuito amateur de pádel organizado por
          torneos independientes a lo largo de la temporada, con un ranking
          conjunto y un Master Final que reúne a los mejores de cada
          categoría.
        </p>
      </div>

      <div>
        <h2 className="font-display text-xl mb-2">Formato de partido</h2>
        <ul className="text-sm text-navy/80 space-y-1 list-disc pl-5">
          <li>Fase de grupos: 1 set con bola de oro; 5-5 se resuelve con tiebreak</li>
          <li>Fase final (excepto la final): a 9 juegos con bola de oro; 8-8 se resuelve con tiebreak</li>
          <li>Final: super tiebreak como tercer set, en vez de tercer set completo</li>
        </ul>
      </div>

      <div>
        <h2 className="font-display text-xl mb-2">Categorías</h2>
        <p className="text-sm text-navy/80">
          2ª categoría, 3ª categoría, 4ª categoría e Iniciación, según nivel de
          juego. El ascenso o descenso de categoría lo decide la organización
          según el rendimiento en el circuito.
        </p>
      </div>

      <div>
        <h2 className="font-display text-xl mb-2">Sistema de puntos</h2>
        <p className="text-sm text-navy/80 mb-3">
          El ranking es móvil: cada torneo suma puntos durante 12 meses desde
          que se jugó. La tabla de puntos depende de la categoría y de hasta
          dónde llegues en el cuadro Oro, Plata o Bronce:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left border-b border-navy/10">
                <th className="py-2">Resultado</th>
                <th className="py-2 text-center">2ª</th>
                <th className="py-2 text-center">3ª</th>
                <th className="py-2 text-center">4ª</th>
                <th className="py-2 text-center">Iniciación</th>
              </tr>
            </thead>
            <tbody>
              {TABLA.map((fila) => (
                <tr key={fila.r} className="border-b border-navy/5">
                  <td className="py-1.5">{fila.r}</td>
                  {fila.p.map((v, i) => (
                    <td key={i} className="py-1.5 text-center">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl mb-2">Master Final</h2>
        <p className="text-sm text-navy/80">
          Las 6 mejores parejas del ranking de cada categoría que hayan
          jugado un mínimo de 2 torneos del circuito pasan directamente a la
          fase final del Master; el resto de inscritos juega la fase de
          grupos. Hay un Master Final por categoría.
        </p>
      </div>
    </main>
  );
}