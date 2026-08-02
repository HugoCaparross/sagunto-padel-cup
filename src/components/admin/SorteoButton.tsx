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
    setEnviando(true);
    setError(null);
    const res = await generarSorteo(torneoId, categoriaId);
    if (!res.ok) setError(res.error ?? "Error al generar el sorteo");
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
        {enviando ? "Generando..." : "Generar / regenerar sorteo"}
      </button>
      {error && <p className="text-coral text-sm mt-2">{error}</p>}
    </div>
  );
}