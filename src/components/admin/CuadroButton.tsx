// Ruta: src/components/admin/CuadroButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generarFaseFinal } from "@/app/(admin)/admin/torneos/[id]/cuadros/actions";

export default function CuadroButton({
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
    setEnviando(true);
    setError(null);
    const res = await generarFaseFinal(torneoId, categoriaId);
    if (!res.ok) setError(res.error ?? "Error al generar el cuadro");
    setEnviando(false);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={ejecutar}
        disabled={enviando}
        className="rounded-card bg-coral text-offwhite font-display px-5 py-2 text-sm disabled:opacity-50"
      >
        {enviando ? "Generando..." : "Generar fase final (Oro/Plata/Bronce)"}
      </button>
      {error && <p className="text-coral text-sm mt-2">{error}</p>}
    </div>
  );
}