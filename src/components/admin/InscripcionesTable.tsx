// Ruta: src/components/admin/InscripcionesTable.tsx
"use client";

import { useState } from "react";
import {
  updatePairEstado,
  toggleCheckIn,
} from "@/app/(admin)/admin/torneos/[id]/inscripciones/actions";

type Fila = {
  pairId: string;
  registrationId: string;
  categoria: string;
  jugadores: string;
  estado: string;
  checkedIn: boolean;
};

export default function InscripcionesTable({
  torneoId,
  filas,
}: {
  torneoId: string;
  filas: Fila[];
}) {
  const [datos, setDatos] = useState(filas);

  async function cambiarEstado(pairId: string, estado: string) {
    setDatos((prev) =>
      prev.map((f) => (f.pairId === pairId ? { ...f, estado } : f))
    );
    await updatePairEstado(torneoId, pairId, estado);
  }

  async function marcarCheckIn(registrationId: string, checked: boolean) {
    setDatos((prev) =>
      prev.map((f) =>
        f.registrationId === registrationId ? { ...f, checkedIn: checked } : f
      )
    );
    await toggleCheckIn(torneoId, registrationId, checked);
  }

  return (
    <div className="space-y-3">
      {datos.map((f) => (
        <div
          key={f.pairId}
          className="rounded-card bg-navy-light px-4 py-3 flex flex-wrap items-center gap-3 justify-between"
        >
          <div>
            <p className="font-semibold">{f.jugadores}</p>
            <p className="text-sm text-sage">{f.categoria}</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={f.estado}
              onChange={(e) => cambiarEstado(f.pairId, e.target.value)}
              className="rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
            >
              <option value="confirmada">Confirmada</option>
              <option value="lista_espera">Lista de espera</option>
              <option value="incompleta">Incompleta</option>
              <option value="cancelada">Cancelada</option>
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={f.checkedIn}
                onChange={(e) =>
                  marcarCheckIn(f.registrationId, e.target.checked)
                }
              />
              Check-in
            </label>
          </div>
        </div>
      ))}

      {!datos.length && (
        <p className="text-offwhite/60">Aún no hay inscripciones.</p>
      )}
    </div>
  );
}