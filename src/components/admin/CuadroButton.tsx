// Ruta: src/components/admin/CuadroButton.tsx

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { generarFaseFinal } from "@/app/(admin)/admin/torneos/[id]/cuadros/actions";

interface CuadroButtonProps {
  torneoId: string;
  categoriaId: string;
}

export default function CuadroButton({
  torneoId,
  categoriaId,
}: CuadroButtonProps) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function abrir() {
    setError(null);
    setAbierto(true);
  }

  function cerrar() {
    if (enviando) return;
    setAbierto(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  async function confirmar() {
    if (enviando) return;
    setEnviando(true);
    setError(null);

    try {
      const res = await generarFaseFinal(torneoId, categoriaId);
      if (!res.ok) {
        setError(res.error ?? "No se ha podido generar el cuadro.");
        return;
      }
      setAbierto(false);
      router.refresh();
    } catch (actionError) {
      console.error("[CuadroButton] Error generando fase final:", actionError);
      setError("Ha ocurrido un error inesperado al generar el cuadro.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        ref={triggerRef}
        type="button"
        onClick={abrir}
        disabled={enviando}
        className="rounded-card bg-coral px-5 py-2 text-sm font-semibold text-offwhite disabled:cursor-not-allowed disabled:opacity-50"
      >
        Generar cuadro
      </button>

      <p className="max-w-md text-xs leading-5 text-offwhite/40">
        Antes de publicar, revisa que la clasificación y los partidos estén
        completos.
      </p>

      {error && !abierto ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}

      {abierto ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/75 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="generar-cuadro-title"
        >
          <div className="w-full max-w-lg rounded-card border border-offwhite/10 bg-navy-light p-5 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sage">
              Revisión antes de generar
            </p>
            <h2
              id="generar-cuadro-title"
              className="mt-2 font-display text-2xl"
            >
              Generar cuadro
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-offwhite/70">
              <li>
                • Se utilizará la clasificación disponible en este momento.
              </li>
              <li>
                • Los datos incompletos o inconsistentes pueden impedir la
                generación.
              </li>
              <li>
                • Una vez generado, la estructura competitiva debe revisarse
                antes de publicarse.
              </li>
              <li>
                • Cualquier modificación posterior debe quedar controlada y
                justificada.
              </li>
            </ul>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-coral">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cerrar}
                disabled={enviando}
                className="rounded-card border border-offwhite/20 px-4 py-2 text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={enviando}
                className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite disabled:opacity-50"
              >
                {enviando ? "Generando..." : "Confirmar generación"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
