// Ruta: src/components/OnboardingModal.tsx
"use client";

import { useState } from "react";
import { marcarOnboardingCompletado } from "@/app/(private)/app/onboarding-actions";

const PASOS = [
  {
    titulo: "Bienvenido a Sagunto Padel Cup",
    texto: "Aquí verás tu ranking, tus torneos y todo lo que necesitas para seguir el circuito.",
  },
  {
    titulo: "El ranking es móvil",
    texto: "Cada torneo suma puntos durante 12 meses. Cuantos más torneos juegues, más alto llegas.",
  },
  {
    titulo: "Race to Master",
    texto: "Las 6 mejores parejas de cada categoría con mínimo 2 torneos jugados clasifican directas al Master Final.",
  },
  {
    titulo: "Tu categoría puede cambiar",
    texto: "La organización revisa tu rendimiento y puede ascenderte o descenderte de categoría, siempre con el motivo explicado.",
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(true);
  const [paso, setPaso] = useState(0);

  async function cerrar() {
    setVisible(false);
    await marcarOnboardingCompletado();
  }

  if (!visible) return null;

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  return (
    <div className="fixed inset-0 bg-navy/80 flex items-center justify-center p-5 z-50">
      <div className="bg-offwhite rounded-card p-6 max-w-sm w-full">
        <h2 className="font-display text-xl mb-2 text-navy">{actual.titulo}</h2>
        <p className="text-sm text-navy/70 mb-6">{actual.texto}</p>

        <div className="flex items-center justify-between">
          <button onClick={cerrar} className="text-sm text-navy/50 underline">
            Saltar
          </button>
          <button
            onClick={() => (esUltimo ? cerrar() : setPaso((p) => p + 1))}
            className="rounded-card bg-coral text-offwhite font-display px-5 py-2"
          >
            {esUltimo ? "Empezar" : "Siguiente"}
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center">
          {PASOS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === paso ? "bg-coral" : "bg-navy/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}