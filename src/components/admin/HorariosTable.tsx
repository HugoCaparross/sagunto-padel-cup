// Ruta: src/components/admin/HorariosTable.tsx

"use client";

import { useMemo, useState } from "react";
import { actualizarHorario } from "@/app/(admin)/admin/torneos/[id]/horarios/actions";

type Fila = {
  id: string;
  pista: string;
  horaProgramada: string;
  jugadores: string;
};

interface HorariosTableProps {
  torneoId: string;
  filas: Fila[];
}

export default function HorariosTable({ torneoId, filas }: HorariosTableProps) {
  const [datos, setDatos] = useState(filas);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const visibles = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    if (!query) return datos;
    return datos.filter((fila) =>
      `${fila.jugadores} ${fila.pista}`.toLowerCase().includes(query),
    );
  }, [busqueda, datos]);

  async function actualizar(
    id: string,
    campo: "pista" | "horaProgramada",
    valor: string,
  ) {
    const fila = datos.find((item) => item.id === id);
    if (!fila) return;
    const nuevosValores = {
      pista: campo === "pista" ? valor : fila.pista,
      horaProgramada: campo === "horaProgramada" ? valor : fila.horaProgramada,
    };
    setGuardandoId(id);
    setError(null);
    try {
      const resultado = await actualizarHorario(
        torneoId,
        id,
        nuevosValores.pista,
        nuevosValores.horaProgramada,
      );
      if (!resultado?.ok) {
        setError(resultado?.error ?? "No se ha podido actualizar el horario.");
        return;
      }
      setDatos((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...nuevosValores } : item,
        ),
      );
    } catch (actionError) {
      console.error("[HorariosTable] Error actualizando horario:", actionError);
      setError("Ha ocurrido un error inesperado al actualizar el horario.");
    } finally {
      setGuardandoId(null);
    }
  }

  return (
    <section aria-labelledby="horarios-list-title" className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="horarios-list-title" className="font-display text-xl">
            Partidos programados
          </h2>
          <p className="mt-1 text-sm text-offwhite/50">
            Revisa pista y hora. Los conflictos deben resolverse antes de
            publicar.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <label
            htmlFor="horarios-busqueda"
            className="mb-1 block text-xs font-semibold text-offwhite/70"
          >
            Buscar partido o pista
          </label>
          <input
            id="horarios-busqueda"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral"
          />
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}
      {visibles.map((fila) => {
        const guardando = guardandoId === fila.id;
        return (
          <div
            key={fila.id}
            className="flex flex-col gap-3 border-b border-offwhite/10 py-4 md:flex-row md:items-center md:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{fila.jugadores}</p>
              {guardando ? (
                <p className="mt-1 text-[11px] text-sage">Guardando...</p>
              ) : null}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 md:flex">
              <div>
                <label
                  htmlFor={`pista-${fila.id}`}
                  className="mb-1 block text-[11px] text-offwhite/45"
                >
                  Pista
                </label>
                <input
                  id={`pista-${fila.id}`}
                  value={fila.pista}
                  onChange={(event) =>
                    setDatos((prev) =>
                      prev.map((item) =>
                        item.id === fila.id
                          ? { ...item, pista: event.target.value }
                          : item,
                      ),
                    )
                  }
                  onBlur={(event) =>
                    actualizar(fila.id, "pista", event.target.value)
                  }
                  disabled={guardando}
                  className="w-full rounded-card border border-offwhite/20 bg-navy px-2 py-1.5 text-sm outline-none focus:border-coral disabled:opacity-50 md:w-24"
                />
              </div>
              <div>
                <label
                  htmlFor={`hora-${fila.id}`}
                  className="mb-1 block text-[11px] text-offwhite/45"
                >
                  Fecha y hora
                </label>
                <input
                  id={`hora-${fila.id}`}
                  type="datetime-local"
                  value={fila.horaProgramada}
                  onChange={(event) =>
                    setDatos((prev) =>
                      prev.map((item) =>
                        item.id === fila.id
                          ? { ...item, horaProgramada: event.target.value }
                          : item,
                      ),
                    )
                  }
                  onBlur={(event) =>
                    actualizar(fila.id, "horaProgramada", event.target.value)
                  }
                  disabled={guardando}
                  className="w-full rounded-card border border-offwhite/20 bg-navy px-2 py-1.5 text-sm outline-none focus:border-coral disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        );
      })}
      {!visibles.length ? (
        <div className="border border-dashed border-offwhite/15 px-5 py-8">
          <p className="text-sm">
            No hay partidos que coincidan con la búsqueda.
          </p>
        </div>
      ) : null}
    </section>
  );
}
