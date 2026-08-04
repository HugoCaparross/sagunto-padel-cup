// Ruta: src/app/(public)/circuito/reglamento/page.tsx
export const metadata = { title: "Reglamento" };

export default function ReglamentoPage() {
  return (
    <main className="max-w-2xl mx-auto px-5 py-12 space-y-6">
      <h1 className="font-display text-3xl mb-4">Reglamento</h1>

      <div>
        <h2 className="font-display text-lg mb-1">Formato de partido</h2>
        <p className="text-sm text-navy/70">
          Fase de grupos: 1 set con bola de oro, tiebreak a 5-5. Fase final
          (excepto la final): a 9 juegos con bola de oro, tiebreak a 8-8.
          Final: super tiebreak como tercer set.
        </p>
      </div>

      <div>
        <h2 className="font-display text-lg mb-1">Walkover e incomparecencia</h2>
        <p className="text-sm text-navy/70">
          Una pareja que no se presente a su partido en la hora asignada
          pierde el partido por walkover. La organización puede aplicar un
          margen de cortesía razonable antes de dar el partido por perdido.
        </p>
      </div>

      <div>
        <h2 className="font-display text-lg mb-1">Código de conducta</h2>
        <p className="text-sm text-navy/70">
          Se espera deportividad y respeto hacia rivales, organización y
          material de las instalaciones en todo momento. La organización
          puede suspender temporalmente a un jugador en caso de conducta
          antideportiva grave.
        </p>
      </div>

      <div>
        <h2 className="font-display text-lg mb-1">Normas de pista</h2>
        <p className="text-sm text-navy/70">
          Cada pareja es responsable de dejar la pista en condiciones
          adecuadas para el siguiente partido y de respetar los horarios
          asignados.
        </p>
      </div>
    </main>
  );
}