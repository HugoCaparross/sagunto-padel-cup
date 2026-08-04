// Ruta: src/components/admin/AccesoColaboradorForm.tsx
"use client";

import { useState } from "react";
import { crearAccesoColaborador } from "@/app/(admin)/admin/torneos/[id]/galeria/actions";

export default function AccesoColaboradorForm({ torneoId }: { torneoId: string }) {
  const [nombre, setNombre] = useState("");
  const [dias, setDias] = useState(14);
  const [url, setUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function crear() {
    if (!nombre) return;
    setEnviando(true);
    const res = await crearAccesoColaborador(torneoId, nombre, dias);
    if (res.ok && res.token) {
      setUrl(`${window.location.origin}/subir/${res.token}`);
    }
    setEnviando(false);
  }

  return (
    <div className="rounded-card bg-navy-light p-4 space-y-3 max-w-md">
      <p className="font-semibold text-sm">Acceso para fotógrafo/videógrafo externo</p>
      <div className="flex gap-2">
        <input
          placeholder="Nombre del colaborador"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="flex-1 rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={dias}
          onChange={(e) => setDias(Number(e.target.value))}
          className="w-20 rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
      </div>
      <button
        onClick={crear}
        disabled={enviando}
        className="rounded-card bg-coral text-offwhite text-sm px-4 py-2 disabled:opacity-50"
      >
        {enviando ? "Generando..." : "Generar enlace de subida"}
      </button>
      {url && (
        <p className="text-sm break-all">
          Enlace (compártelo por WhatsApp): <span className="text-sage">{url}</span>
        </p>
      )}
    </div>
  );
}