// Ruta: src/components/admin/HorariosTable.tsx
"use client";

import { useState } from "react";
import { actualizarHorario } from "@/app/(admin)/admin/torneos/[id]/horarios/actions";

type Fila = {
  id: string;
  pista: string;
  horaProgramada: string; // formato datetime-local, ej. 2026-09-12T09:00
  jugadores: string;
};

export default function HorariosTable({
  torneoId,
  filas,
}: {
  torneoId: string;
  filas: Fila[];
}) {
  const [datos, setDatos] = useState(filas);

  async function actualizar(id: string, campo: "pista" | "horaProgramada", valor: string) {
    setDatos((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
    const fila = datos.find((f) => f.id === id);
    if (!fila) return;
    await actualizarHorario(
      torneoId,
      id,
      campo === "pista" ? valor : fila.pista,
      campo === "horaProgramada" ? valor : fila.horaProgramada
    );
  }

  return (
    <div className="space-y-2">
      {datos.map((f) => (
        <div key={f.id} className="rounded-card bg-navy-light px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <span className="text-sm">{f.jugadores}</span>
          <div className="flex items-center gap-2">
            <input
              value={f.pista}
              onChange={(e) => actualizar(f.id, "pista", e.target.value)}
              className="w-24 rounded-card border border-offwhite/20 bg-navy px-2 py-1 text-sm"
            />
            <input
              type="datetime-local"
              value={f.horaProgramada}
              onChange={(e) => actualizar(f.id, "horaProgramada", e.target.value)}
              className="rounded-card border border-offwhite/20 bg-navy px-2 py-1 text-sm"
            />
          </div>
        </div>
      ))}
      {!datos.length && <p className="text-offwhite/60 text-sm">No hay partidos generados todavía.</p>}
    </div>
  );
}