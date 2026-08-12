// Ruta: src/components/admin/HorariosTable.tsx

"use client";

import { useState } from "react";
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
  const [datos, setDatos] = useState<Fila[]>(filas);

  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function actualizar(
    id: string,
    campo: "pista" | "horaProgramada",
    valor: string,
  ) {
    const fila = datos.find((item) => item.id === id);

    if (!fila) {
      return;
    }

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
          item.id === id
            ? {
                ...item,
                ...nuevosValores,
              }
            : item,
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
    <div className="space-y-2">
      {error ? (
        <p role="alert" className="mb-3 text-sm text-coral">
          {error}
        </p>
      ) : null}

      {datos.map((fila) => {
        const guardando = guardandoId === fila.id;

        return (
          <div
            key={fila.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-navy-light px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{fila.jugadores}</p>

              {guardando ? (
                <p className="mt-1 text-[11px] text-sage">Guardando...</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only">Pista</label>

              <input
                value={fila.pista}
                onChange={(event) =>
                  setDatos((prev) =>
                    prev.map((item) =>
                      item.id === fila.id
                        ? {
                            ...item,
                            pista: event.target.value,
                          }
                        : item,
                    ),
                  )
                }
                onBlur={(event) =>
                  actualizar(fila.id, "pista", event.target.value)
                }
                disabled={guardando}
                aria-label={`Pista de ${fila.jugadores}`}
                className="w-24 rounded-card border border-offwhite/20 bg-navy px-2 py-1.5 text-sm outline-none transition focus:border-coral disabled:opacity-50"
              />

              <label className="sr-only">Hora programada</label>

              <input
                type="datetime-local"
                value={fila.horaProgramada}
                onChange={(event) =>
                  setDatos((prev) =>
                    prev.map((item) =>
                      item.id === fila.id
                        ? {
                            ...item,
                            horaProgramada: event.target.value,
                          }
                        : item,
                    ),
                  )
                }
                onBlur={(event) =>
                  actualizar(fila.id, "horaProgramada", event.target.value)
                }
                disabled={guardando}
                aria-label={`Hora de ${fila.jugadores}`}
                className="rounded-card border border-offwhite/20 bg-navy px-2 py-1.5 text-sm outline-none transition focus:border-coral disabled:opacity-50"
              />
            </div>
          </div>
        );
      })}

      {!datos.length ? (
        <p className="text-sm text-offwhite/60">
          No hay partidos generados todavía.
        </p>
      ) : null}
    </div>
  );
}
