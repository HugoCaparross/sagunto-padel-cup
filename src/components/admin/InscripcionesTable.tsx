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

interface InscripcionesTableProps {
  torneoId: string;
  filas: Fila[];
}

export default function InscripcionesTable({
  torneoId,
  filas,
}: InscripcionesTableProps) {
  const [datos, setDatos] = useState<Fila[]>(filas);

  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function cambiarEstado(pairId: string, estado: string) {
    const anterior = datos.find((fila) => fila.pairId === pairId);

    if (!anterior || anterior.estado === estado) {
      return;
    }

    setError(null);
    setActualizandoId(pairId);

    setDatos((prev) =>
      prev.map((fila) =>
        fila.pairId === pairId
          ? {
              ...fila,
              estado,
            }
          : fila,
      ),
    );

    try {
      const resultado = await updatePairEstado(torneoId, pairId, estado);

      if (!resultado?.ok) {
        setDatos((prev) =>
          prev.map((fila) =>
            fila.pairId === pairId
              ? {
                  ...fila,
                  estado: anterior.estado,
                }
              : fila,
          ),
        );

        setError(
          resultado?.error ??
            "No se ha podido actualizar el estado de la inscripción.",
        );
      }
    } catch (actionError) {
      console.error(
        "[InscripcionesTable] Error actualizando estado:",
        actionError,
      );

      setDatos((prev) =>
        prev.map((fila) =>
          fila.pairId === pairId
            ? {
                ...fila,
                estado: anterior.estado,
              }
            : fila,
        ),
      );

      setError("Ha ocurrido un error inesperado al actualizar la inscripción.");
    } finally {
      setActualizandoId(null);
    }
  }

  async function marcarCheckIn(registrationId: string, checked: boolean) {
    const anterior = datos.find(
      (fila) => fila.registrationId === registrationId,
    );

    if (!anterior || anterior.checkedIn === checked) {
      return;
    }

    setError(null);
    setActualizandoId(anterior.pairId);

    setDatos((prev) =>
      prev.map((fila) =>
        fila.registrationId === registrationId
          ? {
              ...fila,
              checkedIn: checked,
            }
          : fila,
      ),
    );

    try {
      const resultado = await toggleCheckIn(torneoId, registrationId, checked);

      if (!resultado?.ok) {
        setDatos((prev) =>
          prev.map((fila) =>
            fila.registrationId === registrationId
              ? {
                  ...fila,
                  checkedIn: anterior.checkedIn,
                }
              : fila,
          ),
        );

        setError(resultado?.error ?? "No se ha podido actualizar el check-in.");
      }
    } catch (actionError) {
      console.error(
        "[InscripcionesTable] Error actualizando check-in:",
        actionError,
      );

      setDatos((prev) =>
        prev.map((fila) =>
          fila.registrationId === registrationId
            ? {
                ...fila,
                checkedIn: anterior.checkedIn,
              }
            : fila,
        ),
      );

      setError("Ha ocurrido un error inesperado al actualizar el check-in.");
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}

      {datos.map((fila) => {
        const actualizando = actualizandoId === fila.pairId;

        return (
          <div
            key={fila.pairId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-navy-light px-4 py-3"
          >
            <div>
              <p className="font-semibold">{fila.jugadores}</p>

              <p className="text-sm text-sage">{fila.categoria}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="sr-only">Estado de la inscripción</label>

              <select
                value={fila.estado}
                onChange={(event) =>
                  cambiarEstado(fila.pairId, event.target.value)
                }
                disabled={actualizando}
                className="rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none transition focus:border-coral disabled:opacity-50"
              >
                <option value="confirmada">Confirmada</option>
                <option value="lista_espera">Lista de espera</option>
                <option value="incompleta">Incompleta</option>
                <option value="cancelada">Cancelada</option>
              </select>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fila.checkedIn}
                  onChange={(event) =>
                    marcarCheckIn(fila.registrationId, event.target.checked)
                  }
                  disabled={actualizando}
                  className="h-4 w-4"
                />
                Check-in
              </label>
            </div>
          </div>
        );
      })}

      {!datos.length ? (
        <p className="text-sm text-offwhite/60">Aún no hay inscripciones.</p>
      ) : null}
    </div>
  );
}
