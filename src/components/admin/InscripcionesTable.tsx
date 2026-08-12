// Ruta: src/components/admin/InscripcionesTable.tsx

"use client";

import { useMemo, useState } from "react";
import {
  toggleCheckIn,
  updatePairEstado,
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
  const [datos, setDatos] = useState(filas);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const visibles = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return datos.filter((fila) => {
      const coincideTexto =
        !query ||
        `${fila.jugadores} ${fila.categoria}`.toLowerCase().includes(query);
      const coincideEstado =
        estadoFiltro === "todos" || fila.estado === estadoFiltro;
      return coincideTexto && coincideEstado;
    });
  }, [busqueda, datos, estadoFiltro]);

  async function cambiarEstado(pairId: string, estado: string) {
    const anterior = datos.find((fila) => fila.pairId === pairId);
    if (!anterior || anterior.estado === estado) return;
    setError(null);
    setActualizandoId(pairId);
    setDatos((prev) =>
      prev.map((fila) => (fila.pairId === pairId ? { ...fila, estado } : fila)),
    );
    try {
      const resultado = await updatePairEstado(torneoId, pairId, estado);
      if (!resultado?.ok) {
        setDatos((prev) =>
          prev.map((fila) =>
            fila.pairId === pairId
              ? { ...fila, estado: anterior.estado }
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
          fila.pairId === pairId ? { ...fila, estado: anterior.estado } : fila,
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
    if (!anterior || anterior.checkedIn === checked) return;
    setError(null);
    setActualizandoId(anterior.pairId);
    setDatos((prev) =>
      prev.map((fila) =>
        fila.registrationId === registrationId
          ? { ...fila, checkedIn: checked }
          : fila,
      ),
    );
    try {
      const resultado = await toggleCheckIn(torneoId, registrationId, checked);
      if (!resultado?.ok) {
        setDatos((prev) =>
          prev.map((fila) =>
            fila.registrationId === registrationId
              ? { ...fila, checkedIn: anterior.checkedIn }
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
            ? { ...fila, checkedIn: anterior.checkedIn }
            : fila,
        ),
      );
      setError("Ha ocurrido un error inesperado al actualizar el check-in.");
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <section aria-labelledby="inscripciones-table-title" className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="inscripciones-table-title" className="font-display text-xl">
            Inscripciones
          </h2>
          <p className="mt-1 text-sm text-offwhite/50">
            Busca, filtra y resuelve el estado de cada pareja antes del sorteo.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label
              htmlFor="inscripciones-busqueda"
              className="mb-1 block text-xs font-semibold text-offwhite/70"
            >
              Buscar
            </label>
            <input
              id="inscripciones-busqueda"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral"
            />
          </div>
          <div>
            <label
              htmlFor="inscripciones-estado"
              className="mb-1 block text-xs font-semibold text-offwhite/70"
            >
              Estado
            </label>
            <select
              id="inscripciones-estado"
              value={estadoFiltro}
              onChange={(event) => setEstadoFiltro(event.target.value)}
              className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral"
            >
              <option value="todos">Todos</option>
              <option value="confirmada">Confirmada</option>
              <option value="lista_espera">Lista de espera</option>
              <option value="incompleta">Incompleta</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-offwhite/40">
        Mostrando {visibles.length} de {datos.length} inscripciones.
      </p>
      <div className="divide-y divide-offwhite/10 border-y border-offwhite/10">
        {visibles.map((fila) => {
          const actualizando = actualizandoId === fila.pairId;
          return (
            <div
              key={fila.pairId}
              className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="font-semibold text-sm">{fila.jugadores}</p>
                <p className="mt-1 text-xs text-sage">{fila.categoria}</p>
                <p className="mt-1 text-xs text-offwhite/40">
                  Estado: {fila.estado}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor={`estado-${fila.pairId}`} className="sr-only">
                  Estado de la inscripción de {fila.jugadores}
                </label>
                <select
                  id={`estado-${fila.pairId}`}
                  value={fila.estado}
                  onChange={(event) =>
                    cambiarEstado(fila.pairId, event.target.value)
                  }
                  disabled={actualizando}
                  className="rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
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
                  />
                  Check-in
                </label>
              </div>
            </div>
          );
        })}
      </div>
      {!visibles.length ? (
        <div className="border border-dashed border-offwhite/15 px-5 py-8">
          <p className="text-sm">
            No hay inscripciones que coincidan con los filtros.
          </p>
        </div>
      ) : null}
    </section>
  );
}
