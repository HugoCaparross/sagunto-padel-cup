// Ruta: src/components/CancelarButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelarInscripcion } from "@/app/(private)/app/torneos/actions";

export default function CancelarButton({ pairId }: { pairId: string }) {
  const router = useRouter();

  const [enviando, setEnviando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function cancelar() {
    if (enviando) {
      return;
    }

    const confirmado = window.confirm(
      "¿Seguro que quieres darte de baja de este torneo?",
    );

    if (!confirmado) {
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const resultado = await cancelarInscripcion(pairId);

      if (!resultado.ok) {
        setError(resultado.error ?? "No se ha podido cancelar la inscripción.");
        return;
      }

      router.refresh();
    } catch (actionError) {
      console.error(
        "[CancelarButton] Error cancelando inscripción:",
        actionError,
      );

      setError("Ha ocurrido un error inesperado al cancelar la inscripción.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={cancelar}
        disabled={enviando}
        className="text-coral text-sm underline disabled:opacity-50"
      >
        {enviando ? "Cancelando..." : "Darme de baja"}
      </button>

      {error ? (
        <p role="alert" className="mt-2 text-coral text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
