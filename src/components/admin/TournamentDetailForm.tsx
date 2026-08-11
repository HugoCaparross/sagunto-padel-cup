// Ruta: src/components/admin/TournamentDetailForm.tsx — sustituye entero al archivo actual
"use client";

import { useState } from "react";
import {
  updateTournamentEstado,
  updateTournamentClub,
  updateTournamentInfo,
  setTournamentCategory,
} from "@/app/(admin)/admin/torneos/[id]/actions";

type Categoria = {
  id: string;
  nombre: string;
};

type Club = {
  id: string;
  nombre: string;
};

type CategoriaActiva = {
  categoria_id: string;
  cupo_minimo: number;
  cupo_maximo: number;
};

const ESTADOS = [
  "borrador",
  "publicado",
  "inscripciones_abiertas",
  "en_juego",
  "finalizado",
  "archivado",
];

type PendingKey =
  | "estado"
  | "club"
  | "info"
  | `categoria:${string}`
  | `cupo:${string}:cupo_minimo`
  | `cupo:${string}:cupo_maximo`;

export default function TournamentDetailForm({
  torneoId,
  estadoActual,
  clubActualId,
  clubs,
  categorias,
  categoriasActivas,
  precioInicial,
  descripcionInicial,
}: {
  torneoId: string;
  estadoActual: string;
  clubActualId: string | null;
  clubs: Club[];
  categorias: Categoria[];
  categoriasActivas: CategoriaActiva[];
  precioInicial: string;
  descripcionInicial: string;
}) {
  const [estado, setEstado] = useState(estadoActual);

  const [clubId, setClubId] = useState(clubActualId ?? "");

  const [precio, setPrecio] = useState(precioInicial);

  const [descripcion, setDescripcion] = useState(descripcionInicial);

  const [guardando, setGuardando] = useState<PendingKey | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [activas, setActivas] = useState<
    Record<string, CategoriaActiva | null>
  >(
    Object.fromEntries(
      categorias.map((c) => [
        c.id,
        categoriasActivas.find((a) => a.categoria_id === c.id) ?? null,
      ]),
    ),
  );

  function estaGuardando(key: PendingKey) {
    return guardando === key;
  }

  async function cambiarEstado(nuevo: string) {
    if (nuevo === estado || guardando !== null) {
      return;
    }

    const anterior = estado;

    setEstado(nuevo);
    setGuardando("estado");
    setError(null);

    try {
      const resultado = await updateTournamentEstado(torneoId, nuevo);

      if (!resultado?.ok) {
        setEstado(anterior);
        setError(
          resultado?.error ?? "No se ha podido cambiar el estado del torneo.",
        );
      }
    } catch (actionError) {
      console.error(
        "[TournamentDetailForm] Error cambiando estado:",
        actionError,
      );

      setEstado(anterior);
      setError("Ha ocurrido un error inesperado al cambiar el estado.");
    } finally {
      setGuardando(null);
    }
  }

  async function cambiarClub(nuevo: string) {
    if (nuevo === clubId || guardando !== null) {
      return;
    }

    const anterior = clubId;

    setClubId(nuevo);
    setGuardando("club");
    setError(null);

    try {
      const resultado = await updateTournamentClub(torneoId, nuevo);

      if (!resultado?.ok) {
        setClubId(anterior);
        setError(
          resultado?.error ?? "No se ha podido actualizar el club del torneo.",
        );
      }
    } catch (actionError) {
      console.error(
        "[TournamentDetailForm] Error cambiando club:",
        actionError,
      );

      setClubId(anterior);
      setError("Ha ocurrido un error inesperado al actualizar el club.");
    } finally {
      setGuardando(null);
    }
  }

  async function guardarInfo() {
    if (guardando !== null) {
      return;
    }

    const precioAnterior = precio;
    const descripcionAnterior = descripcion;

    setGuardando("info");
    setError(null);

    try {
      const resultado = await updateTournamentInfo(torneoId, {
        precio_texto: precio,
        descripcion,
      });

      if (!resultado?.ok) {
        setPrecio(precioAnterior);
        setDescripcion(descripcionAnterior);

        setError(
          resultado?.error ??
            "No se ha podido actualizar la información del torneo.",
        );
      }
    } catch (actionError) {
      console.error(
        "[TournamentDetailForm] Error guardando información:",
        actionError,
      );

      setError("Ha ocurrido un error inesperado al guardar la información.");
    } finally {
      setGuardando(null);
    }
  }

  async function toggleCategoria(categoriaId: string, activa: boolean) {
    if (guardando !== null) {
      return;
    }

    const anterior = activas[categoriaId] ?? null;

    const cupo = anterior ?? {
      categoria_id: categoriaId,
      cupo_minimo: 6,
      cupo_maximo: 12,
    };

    setActivas((prev) => ({
      ...prev,
      [categoriaId]: activa ? cupo : null,
    }));

    setGuardando(`categoria:${categoriaId}`);

    setError(null);

    try {
      const resultado = await setTournamentCategory(
        torneoId,
        categoriaId,
        activa,
        cupo.cupo_minimo,
        cupo.cupo_maximo,
      );

      if (!resultado?.ok) {
        setActivas((prev) => ({
          ...prev,
          [categoriaId]: anterior,
        }));

        setError(
          resultado?.error ?? "No se ha podido actualizar la categoría.",
        );
      }
    } catch (actionError) {
      console.error(
        "[TournamentDetailForm] Error actualizando categoría:",
        actionError,
      );

      setActivas((prev) => ({
        ...prev,
        [categoriaId]: anterior,
      }));

      setError("Ha ocurrido un error inesperado al actualizar la categoría.");
    } finally {
      setGuardando(null);
    }
  }

  async function cambiarCupo(
    categoriaId: string,
    campo: "cupo_minimo" | "cupo_maximo",
    valor: number,
  ) {
    const actual = activas[categoriaId];

    if (!actual) {
      return;
    }

    if (!Number.isInteger(valor) || valor < 1 || valor > 1000) {
      setError("El cupo debe ser un número entero entre 1 y 1000.");
      return;
    }

    const nuevo = {
      ...actual,
      [campo]: valor,
    };

    if (nuevo.cupo_minimo > nuevo.cupo_maximo) {
      setError("El cupo mínimo no puede ser superior al cupo máximo.");
      return;
    }

    const anterior = actual;

    setActivas((prev) => ({
      ...prev,
      [categoriaId]: nuevo,
    }));

    const key: PendingKey = `cupo:${categoriaId}:${campo}`;

    setGuardando(key);
    setError(null);

    try {
      const resultado = await setTournamentCategory(
        torneoId,
        categoriaId,
        true,
        nuevo.cupo_minimo,
        nuevo.cupo_maximo,
      );

      if (!resultado?.ok) {
        setActivas((prev) => ({
          ...prev,
          [categoriaId]: anterior,
        }));

        setError(resultado?.error ?? "No se ha podido actualizar el cupo.");
      }
    } catch (actionError) {
      console.error(
        "[TournamentDetailForm] Error actualizando cupo:",
        actionError,
      );

      setActivas((prev) => ({
        ...prev,
        [categoriaId]: anterior,
      }));

      setError("Ha ocurrido un error inesperado al actualizar el cupo.");
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div className="space-y-8 max-w-md">
      {error ? (
        <p role="alert" className="text-coral text-sm font-semibold">
          {error}
        </p>
      ) : null}

      <div>
        <label className="block font-semibold mb-1">Estado del torneo</label>

        <select
          value={estado}
          onChange={(e) => cambiarEstado(e.target.value)}
          disabled={guardando !== null}
          className="input bg-navy border-offwhite/20 text-offwhite disabled:opacity-50"
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>

        {estaGuardando("estado") ? (
          <p className="mt-1 text-xs text-offwhite/50">Guardando...</p>
        ) : null}
      </div>

      <div>
        <label className="block font-semibold mb-1">Club / sede</label>

        <select
          value={clubId}
          onChange={(e) => cambiarClub(e.target.value)}
          disabled={guardando !== null}
          className="input bg-navy border-offwhite/20 text-offwhite disabled:opacity-50"
        >
          <option value="">Sin asignar</option>

          {clubs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        {estaGuardando("club") ? (
          <p className="mt-1 text-xs text-offwhite/50">Guardando...</p>
        ) : null}
      </div>

      <div>
        <label className="block font-semibold mb-1">
          Precio (texto libre, ej. &quot;15€ por jugador&quot;)
        </label>

        <input
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          disabled={guardando !== null}
          maxLength={120}
          className="input bg-navy border-offwhite/20 text-offwhite mb-3 disabled:opacity-50"
        />

        <label className="block font-semibold mb-1">
          Información adicional
        </label>

        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          maxLength={5000}
          disabled={guardando !== null}
          placeholder="Sistema de competición, partidos garantizados, notas para los jugadores..."
          className="input bg-navy border-offwhite/20 text-offwhite disabled:opacity-50"
        />

        <button
          type="button"
          onClick={guardarInfo}
          disabled={guardando !== null}
          className="btn-primary mt-2 !py-2 !px-4 text-sm disabled:opacity-50"
        >
          {estaGuardando("info") ? "Guardando..." : "Guardar información"}
        </button>
      </div>

      <div>
        <label className="block font-semibold mb-3">
          Categorías disputadas
        </label>

        <div className="space-y-4">
          {categorias.map((c) => {
            const activa = activas[c.id];

            const categoriaGuardando = guardando === `categoria:${c.id}`;

            return (
              <div key={c.id} className="rounded-card bg-navy-light px-4 py-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!activa}
                    onChange={(e) => toggleCategoria(c.id, e.target.checked)}
                    disabled={guardando !== null}
                  />

                  <span>{c.nombre}</span>

                  {categoriaGuardando ? (
                    <span className="text-xs text-offwhite/40">
                      Guardando...
                    </span>
                  ) : null}
                </label>

                {activa && (
                  <div className="flex gap-3 mt-2 pl-7">
                    <label className="text-sm">
                      Mín.
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        step={1}
                        value={activa.cupo_minimo}
                        onChange={(e) => {
                          const value = Number(e.target.value);

                          setActivas((prev) => ({
                            ...prev,
                            [c.id]: {
                              ...activa,
                              cupo_minimo: value,
                            },
                          }));
                        }}
                        onBlur={(e) =>
                          cambiarCupo(
                            c.id,
                            "cupo_minimo",
                            Number(e.target.value),
                          )
                        }
                        disabled={guardando !== null}
                        className="w-16 ml-2 rounded border border-offwhite/20 bg-navy px-2 py-1 disabled:opacity-50"
                      />
                    </label>

                    <label className="text-sm">
                      Máx.
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        step={1}
                        value={activa.cupo_maximo}
                        onChange={(e) => {
                          const value = Number(e.target.value);

                          setActivas((prev) => ({
                            ...prev,
                            [c.id]: {
                              ...activa,
                              cupo_maximo: value,
                            },
                          }));
                        }}
                        onBlur={(e) =>
                          cambiarCupo(
                            c.id,
                            "cupo_maximo",
                            Number(e.target.value),
                          )
                        }
                        disabled={guardando !== null}
                        className="w-16 ml-2 rounded border border-offwhite/20 bg-navy px-2 py-1 disabled:opacity-50"
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
