// Ruta: src/components/admin/CuadroButton.tsx

"use client";

import { useState } from "react";
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

  const [error, setError] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);

  async function ejecutar() {
    const confirmado = window.confirm(
      "¿Quieres generar la fase final para esta categoría?\n\nEsta operación crea la estructura de Oro, Plata y Bronce y no se puede regenerar automáticamente si ya existe un cuadro.",
    );

    if (!confirmado) {
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const res = await generarFaseFinal(torneoId, categoriaId);

      if (!res.ok) {
        setError(res.error ?? "No se ha podido generar el cuadro.");
        return;
      }

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
        type="button"
        onClick={ejecutar}
        disabled={enviando}
        className="rounded-card bg-coral px-5 py-2 text-sm font-semibold text-offwhite transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Generando..." : "Generar fase final (Oro/Plata/Bronce)"}
      </button>

      <p className="max-w-md text-xs leading-5 text-offwhite/40">
        Genera los cuadros a partir de la clasificación actual. Comprueba
        previamente que los resultados y standings son definitivos.
      </p>

      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}
