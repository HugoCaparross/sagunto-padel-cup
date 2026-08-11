// Ruta: src/components/admin/PremiosManager.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearPremio,
  toggleVisiblePremio,
  borrarPremio,
} from "@/app/(admin)/admin/torneos/[id]/premios/actions";

type Categoria = {
  id: string;
  nombre: string;
};

type Sponsor = {
  id: string;
  nombre: string;
};

type Premio = {
  id: string;
  categoria_id: string | null;
  tramo: string | null;
  posicion: string | null;
  descripcion: string;
  patrocinador_id: string | null;
  visible: boolean;
};

interface PremiosManagerProps {
  torneoId: string;
  categorias: Categoria[];
  sponsors: Sponsor[];
  premiosIniciales: Premio[];
}

const INITIAL_FORM = {
  categoria_id: "",
  tramo: "",
  posicion: "",
  descripcion: "",
  patrocinador_id: "",
};

function obtenerTextoTramo(tramo: string | null) {
  switch (tramo) {
    case "oro":
      return "Oro";

    case "plata":
      return "Plata";

    case "bronce":
      return "Bronce";

    case "sorteo":
      return "Sorteo";

    default:
      return "";
  }
}

function obtenerTextoPosicion(posicion: string | null) {
  switch (posicion) {
    case "campeon":
      return "Campeón";

    case "subcampeon":
      return "Subcampeón";

    case "semifinalista":
      return "Semifinalista";

    case "cuartofinalista":
      return "Cuartofinalista";

    default:
      return "";
  }
}

export default function PremiosManager({
  torneoId,
  categorias,
  sponsors,
  premiosIniciales,
}: PremiosManagerProps) {
  const router = useRouter();

  const [premios, setPremios] = useState<Premio[]>(premiosIniciales);

  const [form, setForm] = useState(INITIAL_FORM);

  const [enviando, setEnviando] = useState(false);

  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function crear() {
    const descripcion = form.descripcion.trim();

    if (!descripcion) {
      setError("La descripción del premio es obligatoria.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const resultado = await crearPremio(torneoId, {
        ...form,
        descripcion,
        patrocinador_id: form.patrocinador_id || null,
      });

      if (!resultado?.ok) {
        setError(resultado?.error ?? "No se ha podido crear el premio.");
        return;
      }

      setForm(INITIAL_FORM);
      router.refresh();
    } catch (actionError) {
      console.error("[PremiosManager] Error creando premio:", actionError);

      setError("Ha ocurrido un error inesperado al crear el premio.");
    } finally {
      setEnviando(false);
    }
  }

  async function toggle(id: string, visible: boolean) {
    const premio = premios.find((item) => item.id === id);

    if (!premio) {
      return;
    }

    setActualizandoId(id);
    setError(null);

    try {
      const resultado = await toggleVisiblePremio(torneoId, id, visible);

      if (!resultado?.ok) {
        setError(
          resultado?.error ??
            "No se ha podido cambiar la visibilidad del premio.",
        );
        return;
      }

      setPremios((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                visible,
              }
            : item,
        ),
      );
    } catch (actionError) {
      console.error(
        "[PremiosManager] Error cambiando visibilidad:",
        actionError,
      );

      setError("Ha ocurrido un error inesperado al cambiar la visibilidad.");
    } finally {
      setActualizandoId(null);
    }
  }

  async function borrar(id: string) {
    const premio = premios.find((item) => item.id === id);

    if (!premio) {
      return;
    }

    if (premio.visible) {
      setError("Oculta primero el premio antes de eliminarlo.");
      return;
    }

    const confirmado = window.confirm(
      `¿Quieres eliminar el premio "${premio.descripcion}"?`,
    );

    if (!confirmado) {
      return;
    }

    setActualizandoId(id);
    setError(null);

    try {
      const resultado = await borrarPremio(torneoId, id);

      if (!resultado?.ok) {
        setError(resultado?.error ?? "No se ha podido eliminar el premio.");
        return;
      }

      setPremios((prev) => prev.filter((item) => item.id !== id));
    } catch (actionError) {
      console.error("[PremiosManager] Error eliminando premio:", actionError);

      setError("Ha ocurrido un error inesperado al eliminar el premio.");
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-3 rounded-card bg-navy-light p-4">
        <div>
          <h2 className="text-sm font-semibold">Nuevo premio</h2>

          <p className="mt-1 text-xs leading-5 text-offwhite/50">
            Configura la categoría, tramo, posición y patrocinador cuando
            corresponda.
          </p>
        </div>

        <select
          value={form.categoria_id}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              categoria_id: event.target.value,
            }))
          }
          disabled={enviando}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
        >
          <option value="">Categoría (opcional)</option>

          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>

        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={form.tramo}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                tramo: event.target.value,
              }))
            }
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
          >
            <option value="">Tramo</option>

            <option value="oro">Oro</option>

            <option value="plata">Plata</option>

            <option value="bronce">Bronce</option>

            <option value="sorteo">Sorteo</option>
          </select>

          <select
            value={form.posicion}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                posicion: event.target.value,
              }))
            }
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
          >
            <option value="">Posición</option>

            <option value="campeon">Campeón</option>

            <option value="subcampeon">Subcampeón</option>

            <option value="semifinalista">Semifinalista</option>

            <option value="cuartofinalista">Cuartofinalista</option>
          </select>
        </div>

        <textarea
          placeholder="Descripción del premio"
          rows={3}
          value={form.descripcion}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              descripcion: event.target.value,
            }))
          }
          disabled={enviando}
          maxLength={1000}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
        />

        <select
          value={form.patrocinador_id}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              patrocinador_id: event.target.value,
            }))
          }
          disabled={enviando}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
        >
          <option value="">Patrocinador (opcional)</option>

          {sponsors.map((sponsor) => (
            <option key={sponsor.id} value={sponsor.id}>
              {sponsor.nombre}
            </option>
          ))}
        </select>

        {error ? (
          <p role="alert" className="text-sm text-coral">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={crear}
          disabled={enviando}
          className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Añadiendo..." : "Añadir premio"}
        </button>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Premios configurados</h2>

        <ul className="space-y-2">
          {premios.map((premio) => {
            const actualizando = actualizandoId === premio.id;

            const tramo = obtenerTextoTramo(premio.tramo);

            const posicion = obtenerTextoPosicion(premio.posicion);

            return (
              <li
                key={premio.id}
                className="flex items-center justify-between gap-3 rounded-card bg-navy-light px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm">{premio.descripcion}</p>

                  {tramo || posicion ? (
                    <p className="mt-1 text-xs text-offwhite/45">
                      {[tramo, posicion].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={premio.visible}
                      onChange={(event) =>
                        toggle(premio.id, event.target.checked)
                      }
                      disabled={actualizando}
                    />
                    Visible
                  </label>

                  <button
                    type="button"
                    onClick={() => borrar(premio.id)}
                    disabled={actualizando || premio.visible}
                    title={
                      premio.visible ? "Oculta primero el premio" : undefined
                    }
                    className="text-xs text-coral underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {!premios.length ? (
          <p className="mt-4 text-sm text-offwhite/50">
            Todavía no hay premios configurados.
          </p>
        ) : null}
      </div>
    </div>
  );
}
