// Ruta: src/app/(public)/circuito/reglamento/page.tsx

import Link from "next/link";

export const metadata = {
  title: "Reglamento",
  description:
    "Reglamento oficial de participación y competición de Sagunto Padel Cup.",
};

const SECCIONES = [
  {
    id: "inscripcion",
    titulo: "Inscripción y participación",
    texto:
      "Las condiciones de inscripción, plazas, pareja, lista de espera y baja se aplican según el estado de cada prueba y la configuración publicada por la organización.",
  },
  {
    id: "categorias",
    titulo: "Categorías",
    texto:
      "Las categorías competitivas son 2ª, 3ª, 4ª e Iniciación. Cada categoría mantiene su clasificación y sus resultados de forma independiente.",
  },
  {
    id: "partidos",
    titulo: "Partidos y puntuación de juego",
    texto:
      "En fase de grupos se disputa 1 set con bola de oro y el empate a 5-5 se resuelve con tie-break. En la fase final, salvo la final, se juega a 9 juegos con bola de oro y el empate a 8-8 se resuelve con tie-break. La final utiliza un super tie-break como tercer set.",
  },
  {
    id: "ranking",
    titulo: "Ranking",
    texto:
      "El ranking es individual y se calcula a partir de resultados y reglas de puntuación. Los puntos de una prueba se mantienen dentro de una ventana móvil de 365 días.",
  },
  {
    id: "conducta",
    titulo: "Conducta",
    texto:
      "Se exige respeto hacia rivales, organización, instalaciones y material. Las incidencias de conducta se tramitan por la organización y pueden afectar a la participación cuando proceda.",
  },
  {
    id: "cambios",
    titulo: "Cambios y cancelaciones",
    texto:
      "Los cambios de inscripción, horarios, partidos o estados competitivos dependen del momento de la prueba. Las modificaciones posteriores a un bloqueo competitivo deben estar justificadas y quedar registradas cuando afecten al histórico.",
  },
  {
    id: "incidencias",
    titulo: "Resolución de incidencias",
    texto:
      "Cuando una situación no esté resuelta por estas reglas, la organización debe poder revisar los datos, la trazabilidad de la operación y las consecuencias competitivas antes de tomar una decisión.",
  },
];

export default function ReglamentoPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Reglamento</h1>
        <p className="mt-2 text-sm text-navy/65">
          Versión vigente de las normas de participación y competición.
        </p>
      </header>

      <nav
        aria-label="Índice del reglamento"
        className="mb-8 border-y border-navy/10 py-4"
      >
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          {SECCIONES.map((seccion) => (
            <a key={seccion.id} href={`#${seccion.id}`}>
              {seccion.titulo}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-10">
        {SECCIONES.map((seccion) => (
          <section
            key={seccion.id}
            id={seccion.id}
            aria-labelledby={`${seccion.id}-title`}
          >
            <h2 id={`${seccion.id}-title`} className="font-display text-xl">
              {seccion.titulo}
            </h2>
            <p className="mt-3 text-sm leading-7 text-navy/70">
              {seccion.texto}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t border-navy/10 pt-6 text-sm text-navy/65">
        Si necesitas aclarar una situación concreta, puedes hacerlo desde{" "}
        <Link
          href="/contacto"
          className="font-semibold underline underline-offset-4"
        >
          Contacto
        </Link>
        .
      </p>
    </main>
  );
}
