// Ruta: src/components/CancelarButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelarInscripcion } from "@/app/(private)/app/torneos/actions";

export default function CancelarButton({ pairId }: { pairId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function cancelar() {
    if (!confirm("¿Seguro que quieres darte de baja de este torneo?")) return;
    setEnviando(true);
    await cancelarInscripcion(pairId);
    setEnviando(false);
    router.refresh();
  }

  return (
    <button
      onClick={cancelar}
      disabled={enviando}
      className="text-coral text-sm underline disabled:opacity-50"
    >
      {enviando ? "..." : "Darme de baja"}
    </button>
  );
}