// Ruta: src/app/(public)/error.tsx

"use client";

import { useEffect } from "react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PublicError] Error de página pública:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-3xl">
        No hemos podido cargar esta página
      </h1>
      <p className="mb-6 mt-3 text-navy/70">
        Puede ser un problema temporal. Vuelve a intentarlo en unos segundos.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-card bg-coral px-5 py-3 font-semibold text-offwhite"
      >
        Reintentar
      </button>
    </main>
  );
}
