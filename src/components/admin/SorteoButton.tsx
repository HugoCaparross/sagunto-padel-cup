// Ruta: src/components/admin/SorteoButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generarSorteo } from "@/app/(admin)/admin/torneos/[id]/sorteo/actions";

export default function SorteoButton({
  torneoId,
  categoriaId,
}: {
  torneoId: string;
  categoriaId: string;
}) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);

  async function ejecutar() {
    if (enviando) {
      return;
    }

    const confirmado = window.confirm(
      "¿Quieres generar el sorteo para esta categoría?\n\nComprueba antes que todas las parejas confirmadas sean correctas. Una vez generado, el sorteo no se puede regenerar automáticamente sobre la estructura existente.",
    );

    if (!confirmado) {
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const res = await generarSorteo(torneoId, categoriaId);

      if (!res.ok) {
        setError(res.error ?? "No se ha podido generar el sorteo.");
        return;
      }

      router.refresh();
    } catch (actionError) {
      console.error("[SorteoButton] Error generando sorteo:", actionError);

      setError("Ha ocurrido un error inesperado al generar el sorteo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={ejecutar}
        disabled={enviando}
        className="rounded-card bg-coral text-offwhite font-display px-5 py-2 text-sm disabled:opacity-50"
      >
        {enviando ? "Generando..." : "Generar sorteo"}
      </button>

      {error && (
        <p role="alert" className="text-coral text-sm mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
