// Ruta: src/components/admin/JugadoresTable.tsx

"use client";

import { useMemo, useState } from "react";
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
  puntos?: number;
};
interface JugadoresTableProps {
  jugadoresIniciales: Jugador[];
  categorias: Categoria[];
}

export default function JugadoresTable({
  jugadoresIniciales,
  categorias,
}: JugadoresTableProps) {
  const [jugadores, setJugadores] = useState(jugadoresIniciales);
  const [motivoAbierto, setMotivoAbierto] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const visibles = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return jugadores.filter((jugador) => {
      const texto = `${jugador.nombre} ${jugador.apellidos}`.toLowerCase();
      return (
        (!query || texto.includes(query)) &&
        (estadoFiltro === "todos" || jugador.estado === estadoFiltro)
      );
    });
  }, [busqueda, estadoFiltro, jugadores]);

  async function confirmarCambioCategoria(id: string) {
    const jugador = jugadores.find((item) => item.id === id);
    if (!jugador?.categoria_actual_id) {
      setError("Selecciona una categoría válida.");
      return;
    }
    if (motivo.trim().length < 3) {
      setError("El motivo del cambio debe tener al menos 3 caracteres.");
      return;
    }
    setActualizandoId(id);
    setError(null);
    try {
      const resultado = await cambiarCategoria(
        id,
        jugador.categoria_actual_id,
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
    if (jugador.categoria_actual_id === categoriaId) return;
    setJugadores((prev) =>
      prev.map((item) =>
        item.id === jugador.id
          ? { ...item, categoria_actual_id: categoriaId || null }
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
    if (!jugador) return;
    if (
      valor &&
      !window.confirm(
        `¿Quieres suspender a ${jugador.nombre} ${jugador.apellidos}?`,
      )
    )
      return;
    setActualizandoId(id);
    setError(null);
    const estadoAnterior = jugador.estado;
    setJugadores((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, estado: valor ? "suspendido" : "activo" }
          : item,
      ),
    );
    try {
      const resultado = await toggleSuspendido(id, valor);
      if (!resultado?.ok) {
        setJugadores((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, estado: estadoAnterior } : item,
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
          item.id === id ? { ...item, estado: estadoAnterior } : item,
        ),
      );
      setError("Ha ocurrido un error inesperado al actualizar el jugador.");
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <section aria-labelledby="jugadores-table-title" className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="jugadores-table-title" className="font-display text-xl">
            Directorio de jugadores
          </h2>
          <p className="mt-1 text-sm text-offwhite/50">
            Busca por nombre y filtra por estado para localizar rápidamente un
            jugador.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label
              htmlFor="jugadores-busqueda"
              className="mb-1 block text-xs font-semibold text-offwhite/70"
            >
              Buscar jugador
            </label>
            <input
              id="jugadores-busqueda"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral"
            />
          </div>
          <div>
            <label
              htmlFor="jugadores-estado"
              className="mb-1 block text-xs font-semibold text-offwhite/70"
            >
              Estado
            </label>
            <select
              id="jugadores-estado"
              value={estadoFiltro}
              onChange={(event) => setEstadoFiltro(event.target.value)}
              className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral"
            >
              <option value="todos">Todos</option>
              <option value="activo">Activo</option>
              <option value="suspendido">Suspendido</option>
            </select>
          </div>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto border-y border-offwhite/10">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-offwhite/10 text-left text-xs uppercase tracking-[0.08em] text-offwhite/40">
              <th className="px-3 py-3">Jugador</th>
              <th className="px-3 py-3">Categoría</th>
              <th className="px-3 py-3 text-right">Puntos</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((jugador) => {
              const actualizando = actualizandoId === jugador.id;
              const motivoVisible = motivoAbierto === jugador.id;
              return (
                <tr
                  key={jugador.id}
                  className="border-b border-offwhite/10 align-top last:border-b-0"
                >
                  <td className="px-3 py-4 font-medium">
                    {jugador.nombre} {jugador.apellidos}
                  </td>
                  <td className="px-3 py-4">
                    <select
                      aria-label={`Categoría de ${jugador.nombre}`}
                      value={jugador.categoria_actual_id ?? ""}
                      onChange={(event) =>
                        seleccionarCategoria(jugador, event.target.value)
                      }
                      disabled={actualizando}
                      className="rounded-card border border-offwhite/20 bg-navy px-3 py-2 outline-none focus:border-coral disabled:opacity-50"
                    >
                      <option value="">Sin categoría</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-4 text-right tabular-nums">
                    {jugador.puntos ?? 0}
                  </td>
                  <td className="px-3 py-4">
                    {jugador.estado === "suspendido" ? (
                      <span className="text-coral">Suspendido</span>
                    ) : (
                      <span className="text-sage">Activo</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        suspender(jugador.id, jugador.estado !== "suspendido")
                      }
                      disabled={actualizando}
                      className="text-xs underline underline-offset-4 disabled:opacity-50"
                    >
                      {jugador.estado === "suspendido"
                        ? "Reactivar"
                        : "Suspender"}
                    </button>
                  </td>
                  {motivoVisible ? (
                    <td colSpan={5} className="px-3 pb-4">
                      <div className="border-l-2 border-sage pl-4">
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
                          maxLength={500}
                          disabled={actualizando}
                          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
                        />
                        <div className="mt-3 flex gap-2">
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
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!visibles.length ? (
        <div className="border border-dashed border-offwhite/15 px-5 py-8">
          <p className="text-sm">
            No hay jugadores que coincidan con los filtros.
          </p>
        </div>
      ) : null}
    </section>
  );
}
