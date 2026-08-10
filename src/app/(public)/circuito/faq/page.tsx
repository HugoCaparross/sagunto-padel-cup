// Ruta: src/app/(public)/circuito/faq/page.tsx
export const metadata = { title: "Preguntas frecuentes" };

const FAQ = [
  {
    q: "¿Cómo me inscribo a un torneo?",
    a: "Entra en la página del torneo desde el calendario y pulsa \"Inscríbete\". Necesitas tener una cuenta creada.",
  },
  {
    q: "¿Cómo se forman las parejas?",
    a: "Puedes inscribirte indicando el email de tu compañero/a si ya lo tienes, o apuntarte a la bolsa de \"busco pareja\" para que otros jugadores sin compañero te encuentren.",
  },
  {
    q: "¿Qué pasa si mi pareja se lesiona antes del torneo?",
    a: "Puedes darte de baja de la inscripción sin coste en cualquier momento desde \"Mis torneos\".",
  },
  {
    q: "¿Cómo funciona la baja de inscripción?",
    a: "Es libre y gratuita en cualquier momento, no hay penalización ni plazo límite.",
  },
  {
    q: "¿Cómo se paga la inscripción?",
    a: "El pago se realiza físicamente el día del torneo, no hay pago online en la plataforma.",
  },
  {
    q: "¿Quién puede jugar el Master Final?",
    a: "Todos los jugadores que cumplan los requisitos de la temporada pueden participar. El ranking individual determina el acceso y la posición.",
  },
  {
    q: "¿Qué ventaja tienen las mejores parejas en el Master?",
    a: "Las 4 mejores parejas de cada categoría acceden directamente al cuadro final. El resto de parejas elegibles comienza en la fase previa.",
  },
];

export default function FaqPage() {
  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-8">Preguntas frecuentes</h1>
      <div className="space-y-6">
        {FAQ.map((item, i) => (
          <div key={i}>
            <p className="font-semibold mb-1">{item.q}</p>
            <p className="text-sm text-navy/70">{item.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
