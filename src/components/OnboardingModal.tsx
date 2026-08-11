// Ruta: src/components/OnboardingModal.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { marcarOnboardingCompletado } from "@/app/(private)/app/onboarding-actions";

const PASOS = [
  {
    titulo: "Bienvenido a Sagunto Padel Cup",
    texto:
      "Consulta tus torneos, sigue tus resultados, suma puntos y lucha por el Master Final.",
  },
  {
    titulo: "El ranking es móvil",
    texto:
      "Cada torneo suma puntos durante 12 meses. Cuantos más torneos juegues, más alto llegas.",
  },
  {
    titulo: "Master Final",
    texto:
      "Todos los jugadores pueden participar en el Master si cumplen los requisitos de la temporada. Las 4 mejores parejas de cada categoría acceden directas al cuadro final; el resto juega una fase previa.",
  },
  {
    titulo: "Tu categoría puede cambiar",
    texto:
      "La organización revisa tu rendimiento y puede ascenderte o descenderte de categoría, siempre con el motivo explicado.",
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(true);

  const [paso, setPaso] = useState(0);

  const [enviando, setEnviando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const primerControlRef = useRef<HTMLButtonElement>(null);

  const actual = PASOS[paso];

  const esUltimo = paso === PASOS.length - 1;

  useEffect(() => {
    if (!visible) {
      return;
    }

    const anteriorOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    primerControlRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!enviando) {
          cerrar();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = anteriorOverflow;

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, enviando]);

  async function cerrar() {
    if (enviando) {
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const resultado = await marcarOnboardingCompletado();

      if (!resultado.ok) {
        setError(
          "No se ha podido guardar el estado del onboarding. Inténtalo de nuevo.",
        );
        return;
      }

      setVisible(false);
    } catch (actionError) {
      console.error(
        "[OnboardingModal] Error completando onboarding:",
        actionError,
      );

      setError("Ha ocurrido un error inesperado. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function siguiente() {
    if (enviando) {
      return;
    }

    if (esUltimo) {
      void cerrar();
      return;
    }

    setPaso((actualPaso) => Math.min(PASOS.length - 1, actualPaso + 1));
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-navy/80 flex items-center justify-center p-5 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
    >
      <div className="bg-offwhite rounded-card p-6 max-w-sm w-full">
        <h2
          id="onboarding-title"
          className="font-display text-xl mb-2 text-navy"
        >
          {actual.titulo}
        </h2>

        <p id="onboarding-description" className="text-sm text-navy/70 mb-6">
          {actual.texto}
        </p>

        {error ? (
          <p role="alert" className="text-sm text-coral mb-4">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <button
            ref={primerControlRef}
            type="button"
            onClick={() => void cerrar()}
            disabled={enviando}
            className="text-sm text-navy/50 underline disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Saltar"}
          </button>

          <button
            type="button"
            onClick={siguiente}
            disabled={enviando}
            className="rounded-card bg-coral text-offwhite font-display px-5 py-2 disabled:opacity-50"
          >
            {enviando ? "Guardando..." : esUltimo ? "Empezar" : "Siguiente"}
          </button>
        </div>

        <div
          className="flex gap-1 mt-4 justify-center"
          aria-label={`Paso ${paso + 1} de ${PASOS.length}`}
        >
          {PASOS.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                i === paso ? "bg-coral" : "bg-navy/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
