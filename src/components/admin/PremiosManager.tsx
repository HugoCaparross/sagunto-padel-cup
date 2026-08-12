// Ruta: src/components/admin/PremiosManager.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  actualizarPremio,
  borrarPremio,
  crearPremio,
  toggleVisiblePremio,
} from "@/app/(admin)/admin/torneos/[id]/premios/actions";

type Categoria = { id: string; nombre: string };
type Sponsor = { id: string; nombre: string };
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
const EMPTY_FORM = {
  categoria_id: "",
  tramo: "",
  posicion: "",
  descripcion: "",
  patrocinador_id: "",
};

export default function PremiosManager({
  torneoId,
  categorias,
  sponsors,
  premiosIniciales,
}: PremiosManagerProps) {
  const router = useRouter();
  const [premios, setPremios] = useState(premiosIniciales);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<Premio | null>(null);
  const [error, setError] = useState<string | null>(null);

  function editar(premio: Premio) {
    setEditandoId(premio.id);
    setForm({
      categoria_id: premio.categoria_id ?? "",
      tramo: premio.tramo ?? "",
      posicion: premio.posicion ?? "",
      descripcion: premio.descripcion,
      patrocinador_id: premio.patrocinador_id ?? "",
    });
    setError(null);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function guardar() {
    const descripcion = form.descripcion.trim();
    if (!descripcion) {
      setError("La descripción del premio es obligatoria.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const resultado = editandoId
        ? await actualizarPremio(torneoId, editandoId, {
            ...form,
            descripcion,
            patrocinador_id: form.patrocinador_id || null,
          })
        : await crearPremio(torneoId, {
            ...form,
            descripcion,
            patrocinador_id: form.patrocinador_id || null,
          });
      if (!resultado?.ok) {
        setError(resultado?.error ?? "No se ha podido guardar el premio.");
        return;
      }
      setForm(EMPTY_FORM);
      setEditandoId(null);
      router.refresh();
    } catch (actionError) {
      console.error("[PremiosManager] Error guardando premio:", actionError);
      setError("Ha ocurrido un error inesperado al guardar el premio.");
    } finally {
      setEnviando(false);
    }
  }

  async function toggle(id: string, visible: boolean) {
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
        prev.map((item) => (item.id === id ? { ...item, visible } : item)),
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

  async function eliminar() {
    if (!confirmacion) return;
    setActualizandoId(confirmacion.id);
    setError(null);
    try {
      const resultado = await borrarPremio(torneoId, confirmacion.id);
      if (!resultado?.ok) {
        setError(resultado?.error ?? "No se ha podido eliminar el premio.");
        return;
      }
      setPremios((prev) => prev.filter((item) => item.id !== confirmacion.id));
      setConfirmacion(null);
    } catch (actionError) {
      console.error("[PremiosManager] Error eliminando premio:", actionError);
      setError("Ha ocurrido un error inesperado al eliminar el premio.");
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <section
      aria-labelledby="premios-manager-title"
      className="max-w-2xl space-y-6"
    >
      <div className="space-y-4 rounded-card bg-navy-light p-4">
        <div>
          <h2 id="premios-manager-title" className="text-sm font-semibold">
            {editandoId ? "Editar premio" : "Nuevo premio"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-offwhite/50">
            Configura categoría, tramo, posición, patrocinador y visibilidad.
          </p>
        </div>
        <div>
          <label
            htmlFor="premio-categoria"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Categoría
          </label>
          <select
            id="premio-categoria"
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
            <option value="">Todas / general</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="premio-tramo"
              className="mb-1.5 block text-xs font-semibold text-offwhite/70"
            >
              Tramo
            </label>
            <select
              id="premio-tramo"
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
              <option value="">Sin tramo</option>
              <option value="oro">Oro</option>
              <option value="plata">Plata</option>
              <option value="bronce">Bronce</option>
              <option value="sorteo">Sorteo</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="premio-posicion"
              className="mb-1.5 block text-xs font-semibold text-offwhite/70"
            >
              Posición
            </label>
            <select
              id="premio-posicion"
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
              <option value="">Sin posición</option>
              <option value="campeon">Campeón</option>
              <option value="subcampeon">Subcampeón</option>
              <option value="semifinalista">Semifinalista</option>
              <option value="cuartofinalista">Cuartofinalista</option>
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="premio-descripcion"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Descripción
          </label>
          <textarea
            id="premio-descripcion"
            value={form.descripcion}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                descripcion: event.target.value,
              }))
            }
            disabled={enviando}
            rows={3}
            maxLength={1000}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
          />
        </div>
        <div>
          <label
            htmlFor="premio-sponsor"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Patrocinador
          </label>
          <select
            id="premio-sponsor"
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
            <option value="">Sin patrocinador</option>
            {sponsors.map((sponsor) => (
              <option key={sponsor.id} value={sponsor.id}>
                {sponsor.nombre}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-coral">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={enviando}
            className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite disabled:opacity-50"
          >
            {enviando
              ? "Guardando..."
              : editandoId
                ? "Guardar cambios"
                : "Crear premio"}
          </button>
          {editandoId ? (
            <button
              type="button"
              onClick={cancelarEdicion}
              disabled={enviando}
              className="rounded-card border border-offwhite/20 px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl">Premios configurados</h2>
        <div className="divide-y divide-offwhite/10 border-y border-offwhite/10">
          {premios.map((premio) => {
            const actualizando = actualizandoId === premio.id;
            return (
              <div
                key={premio.id}
                className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div>
                  <p className="text-sm font-medium">{premio.descripcion}</p>
                  <p className="mt-1 text-xs text-offwhite/45">
                    {[premio.tramo, premio.posicion]
                      .filter(Boolean)
                      .join(" · ") || "Premio general"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs">
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
                    onClick={() => editar(premio)}
                    disabled={actualizandoId !== null}
                    className="text-xs underline underline-offset-4 disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmacion(premio)}
                    disabled={actualizando || premio.visible}
                    className="text-xs text-coral underline underline-offset-4 disabled:opacity-40"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {!premios.length ? (
          <p className="mt-4 text-sm text-offwhite/50">
            Todavía no hay premios configurados.
          </p>
        ) : null}
      </div>

      {confirmacion ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/75 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eliminar-premio-title"
        >
          <div className="w-full max-w-md rounded-card bg-navy-light p-5">
            <h2 id="eliminar-premio-title" className="font-display text-xl">
              Eliminar premio
            </h2>
            <p className="mt-2 text-sm leading-6 text-offwhite/65">
              Se eliminará este premio de la configuración. Comprueba que no
              deba conservarse como histórico.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmacion(null)}
                disabled={Boolean(actualizandoId)}
                className="rounded-card border border-offwhite/20 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminar}
                disabled={Boolean(actualizandoId)}
                className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite disabled:opacity-50"
              >
                {actualizandoId ? "Eliminando..." : "Eliminar premio"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
