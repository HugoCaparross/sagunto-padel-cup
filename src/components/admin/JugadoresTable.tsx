// Ruta: src/components/admin/JugadoresTable.tsx

"use client";

import { useState } from "react";
import {
  cambiarCategoria,
  toggleSuspendido,
} from "@/app/(admin)/admin/jugadores/actions";

type Categoria = {
  id: string;
  nombre: string;
};

type Jugador = {
  id: string;
  nombre: string;
  apellidos: string;
  categoria_actual_id: string | null;
  estado: string;
};

interface JugadoresTableProps {
  jugadoresIniciales: Jugador[];
  categorias: Categoria[];
}

export default function JugadoresTable({
  jugadoresIniciales,
  categorias,
}: JugadoresTableProps) {
  const [jugadores, setJugadores] = useState<Jugador[]>(jugadoresIniciales);

  const [motivoAbierto, setMotivoAbierto] = useState<string | null>(null);

  const [motivo, setMotivo] = useState("");

  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function confirmarCambioCategoria(id: string) {
    const jugador = jugadores.find((item) => item.id === id);

    if (!jugador) {
      return;
    }

    const nuevaCategoria = jugador.categoria_actual_id;

    if (!nuevaCategoria) {
      setError("Selecciona una categoría válida.");
      return;
    }

    setActualizandoId(id);
    setError(null);

    try {
      const resultado = await cambiarCategoria(
        id,
        nuevaCategoria,
        motivo.trim(),
      );

      if (!resultado?.ok) {
        setError(resultado?.error ?? "No se ha podido cambiar la categoría.");

        return;
      }

      setMotivoAbierto(null);

      setMotivo("");
    } catch (actionError) {
      console.error("[JugadoresTable] Error cambiando categoría:", actionError);

      setError("Ha ocurrido un error inesperado al cambiar la categoría.");
    } finally {
      setActualizandoId(null);
    }
  }

  function seleccionarCategoria(jugador: Jugador, categoriaId: string) {
    if (jugador.categoria_actual_id === categoriaId) {
      return;
    }

    setJugadores((prev) =>
      prev.map((item) =>
        item.id === jugador.id
          ? {
              ...item,
              categoria_actual_id: categoriaId || null,
            }
          : item,
      ),
    );

    setMotivo("");
    setMotivoAbierto(jugador.id);
    setError(null);
  }

  function cancelarCambioCategoria(jugador: Jugador) {
    setJugadores((prev) =>
      prev.map((item) =>
        item.id === jugador.id
          ? {
              ...item,
              categoria_actual_id:
                jugadoresIniciales.find(
                  (original) => original.id === jugador.id,
                )?.categoria_actual_id ?? null,
            }
          : item,
      ),
    );

    setMotivoAbierto(null);

    setMotivo("");
  }

  async function suspender(id: string, valor: boolean) {
    const jugador = jugadores.find((item) => item.id === id);

    if (!jugador) {
      return;
    }

    if (valor) {
      const confirmado = window.confirm(
        `¿Quieres suspender a ${jugador.nombre} ${jugador.apellidos}?`,
      );

      if (!confirmado) {
        return;
      }
    }

    setActualizandoId(id);
    setError(null);

    const estadoAnterior = jugador.estado;

    setJugadores((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              estado: valor ? "suspendido" : "activo",
            }
          : item,
      ),
    );

    try {
      const resultado = await toggleSuspendido(id, valor);

      if (!resultado?.ok) {
        setJugadores((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  estado: estadoAnterior,
                }
              : item,
          ),
        );

        setError(
          resultado?.error ??
            "No se ha podido actualizar el estado del jugador.",
        );
      }
    } catch (actionError) {
      console.error(
        "[JugadoresTable] Error actualizando suspensión:",
        actionError,
      );

      setJugadores((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                estado: estadoAnterior,
              }
            : item,
        ),
      );

      setError("Ha ocurrido un error inesperado al actualizar el jugador.");
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

      {jugadores.map((jugador) => {
        const actualizando = actualizandoId === jugador.id;

        const motivoVisible = motivoAbierto === jugador.id;

        return (
          <div
            key={jugador.id}
            className="rounded-card bg-navy-light px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm">
                {jugador.nombre} {jugador.apellidos}
                {jugador.estado === "suspendido" ? (
                  <span className="ml-2 text-xs text-coral">SUSPENDIDO</span>
                ) : null}
              </span>

              <div className="flex items-center gap-3">
                <label className="sr-only">Categoría de {jugador.nombre}</label>

                <select
                  value={jugador.categoria_actual_id ?? ""}
                  onChange={(event) =>
                    seleccionarCategoria(jugador, event.target.value)
                  }
                  disabled={actualizando}
                  className="rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none transition focus:border-coral disabled:opacity-50"
                >
                  <option value="">Sin categoría</option>

                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    suspender(jugador.id, jugador.estado !== "suspendido")
                  }
                  disabled={actualizando}
                  className="text-xs underline underline-offset-4 disabled:opacity-50"
                >
                  {jugador.estado === "suspendido" ? "Reactivar" : "Suspender"}
                </button>
              </div>
            </div>

            {motivoVisible ? (
              <div className="mt-4 border-t border-offwhite/10 pt-4">
                <label
                  htmlFor={`motivo-${jugador.id}`}
                  className="mb-1.5 block text-xs font-semibold text-offwhite/70"
                >
                  Motivo del cambio de categoría
                </label>

                <textarea
                  id={`motivo-${jugador.id}`}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  disabled={actualizando}
                  placeholder="Explica brevemente el motivo del cambio."
                  className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none transition focus:border-coral disabled:opacity-50"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => confirmarCambioCategoria(jugador.id)}
                    disabled={actualizando}
                    className="rounded-card bg-coral px-4 py-2 text-xs font-semibold text-offwhite disabled:opacity-50"
                  >
                    {actualizando ? "Guardando..." : "Confirmar cambio"}
                  </button>

                  <button
                    type="button"
                    onClick={() => cancelarCambioCategoria(jugador)}
                    disabled={actualizando}
                    className="rounded-card border border-offwhite/20 px-4 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
