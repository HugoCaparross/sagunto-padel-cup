// Ruta: src/app/(public)/circuito/faq/page.tsx

import Link from "next/link";

export const metadata = {
  title: "Preguntas frecuentes",
  description:
    "Resuelve las dudas más frecuentes sobre inscripciones, categorías, ranking, partidos, premios, Master y cuenta.",
};

const FAQ = [
  {
    q: "¿Cómo me inscribo a un torneo?",
    a: 'Entra en la página del torneo desde el calendario y pulsa "Inscribirme". Necesitas tener una cuenta creada.',
  },
  {
    q: "¿Cómo se forman las parejas?",
    a: 'Puedes indicar el email de tu compañero/a durante la inscripción o utilizar la bolsa de "busco pareja" cuando esté disponible.',
  },
  {
    q: "¿Qué pasa si mi pareja se lesiona antes del torneo?",
    a: 'Consulta la inscripción desde "Mis torneos" y contacta con la organización si necesitas sustituir a la pareja o resolver una incidencia.',
  },
  {
    q: "¿Cómo funciona la baja de inscripción?",
    a: "La baja se gestiona desde la inscripción cuando el estado del torneo y las reglas de la prueba lo permiten. Si existe una incidencia, contacta con la organización.",
  },
  {
    q: "¿Cómo se paga la inscripción?",
    a: "La plataforma no realiza el pago online. Las condiciones concretas de pago se muestran en la información de cada prueba y en el reglamento.",
  },
  {
    q: "¿Cómo funciona el ranking?",
    a: "El ranking es individual y se calcula a partir de los resultados y las reglas de puntuación. Los puntos tienen una ventana móvil de 365 días.",
  },
  {
    q: "¿Cómo funciona el Master Final?",
    a: "El Master Final es el evento de cierre de la temporada. La clasificación, los cupos y los criterios aplicables se muestran en la sección específica del Master y se actualizan cuando corresponda.",
  },
  {
    q: "¿Dónde puedo consultar el reglamento?",
    a: "Puedes consultar el reglamento completo en la sección Reglamento. Si una situación concreta no queda resuelta, puedes contactar con la organización.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Preguntas frecuentes</h1>
        <p className="mt-2 max-w-2xl text-navy/70">
          Inscripciones, categorías, ranking, partidos, premios, Master y
          cuenta.
        </p>
      </header>

      <div className="divide-y divide-navy/10 border-y border-navy/10">
        {FAQ.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="cursor-pointer list-none pr-8 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-coral">
              {item.q}
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-navy/70">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <p className="mt-8 text-sm text-navy/65">
        ¿No encuentras la respuesta?{" "}
        <Link
          href="/contacto"
          className="font-semibold underline underline-offset-4"
        >
          Contacta con la organización.
        </Link>
      </p>
    </main>
  );
}
