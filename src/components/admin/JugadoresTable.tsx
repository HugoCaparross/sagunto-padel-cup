// Ruta: src/components/admin/JugadoresTable.tsx
"use client";

import { useState } from "react";
import {
  cambiarCategoria,
  toggleSuspendido,
} from "@/app/(admin)/admin/jugadores/actions";

type Categoria = { id: string; nombre: string };
type Jugador = {
  id: string;
  nombre: string;
  apellidos: string;
  categoria_actual_id: string | null;
  estado: string;
};

export default function JugadoresTable({
  jugadoresIniciales,
  categorias,
}: {
  jugadoresIniciales: Jugador[];
  categorias: Categoria[];
}) {
  const [jugadores, setJugadores] = useState(jugadoresIniciales);

  async function cambiar(id: string, categoriaId: string) {
    setJugadores((prev) =>
      prev.map((j) => (j.id === id ? { ...j, categoria_actual_id: categoriaId } : j))
    );
    const motivo = prompt("Motivo del cambio de categoría (se le enviará al jugador):") ?? "";
    await cambiarCategoria(id, categoriaId, motivo);
  }

  async function suspender(id: string, valor: boolean) {
    setJugadores((prev) =>
      prev.map((j) => (j.id === id ? { ...j, estado: valor ? "suspendido" : "activo" } : j))
    );
    await toggleSuspendido(id, valor);
  }

  return (
    <div className="space-y-2">
      {jugadores.map((j) => (
        <div
          key={j.id}
          className="rounded-card bg-navy-light px-4 py-3 flex flex-wrap items-center gap-3 justify-between"
        >
          <span className="text-sm">
            {j.nombre} {j.apellidos}
            {j.estado === "suspendido" && (
              <span className="text-coral text-xs ml-2">SUSPENDIDO</span>
            )}
          </span>

          <div className="flex items-center gap-3">
            <select
              value={j.categoria_actual_id ?? ""}
              onChange={(e) => cambiar(j.id, e.target.value)}
              className="rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            <button
              onClick={() => suspender(j.id, j.estado !== "suspendido")}
              className="text-xs underline"
            >
              {j.estado === "suspendido" ? "Reactivar" : "Suspender"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}