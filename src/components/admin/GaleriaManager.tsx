// Ruta: src/components/admin/GaleriaManager.tsx

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  borrarFoto,
  subirFoto,
} from "@/app/(admin)/admin/torneos/[id]/galeria/actions";

type Foto = { id: string; url: string };

interface GaleriaManagerProps {
  torneoId: string;
  fotosIniciales: Foto[];
}

export default function GaleriaManager({
  torneoId,
  fotosIniciales,
}: GaleriaManagerProps) {
  const router = useRouter();
  const [fotos, setFotos] = useState(fotosIniciales);
  const [subiendo, setSubiendo] = useState(false);
  const [borrandoId, setBorrandoId] = useState<string | null>(null);
  const [fotoAEliminar, setFotoAEliminar] = useState<Foto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function subir(formData: FormData) {
    setSubiendo(true);
    setError(null);
    try {
      const res = await subirFoto(torneoId, formData);
      if (!res.ok) {
        setError(res.error ?? "No se ha podido subir la fotografía.");
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (actionError) {
      console.error("[GaleriaManager] Error subiendo fotografía:", actionError);
      setError("Ha ocurrido un error inesperado al subir la fotografía.");
    } finally {
      setSubiendo(false);
    }
  }

  async function confirmarBorrado() {
    if (!fotoAEliminar || borrandoId) return;
    const foto = fotoAEliminar;
    setBorrandoId(foto.id);
    setError(null);
    try {
      const res = await borrarFoto(torneoId, foto.id);
      if (!res.ok) {
        setError(res.error ?? "No se ha podido eliminar la fotografía.");
        return;
      }
      setFotos((prev) => prev.filter((item) => item.id !== foto.id));
      setFotoAEliminar(null);
      router.refresh();
    } catch (actionError) {
      console.error(
        "[GaleriaManager] Error eliminando fotografía:",
        actionError,
      );
      setError("Ha ocurrido un error inesperado al eliminar la fotografía.");
    } finally {
      setBorrandoId(null);
    }
  }

  return (
    <section aria-labelledby="galeria-title" className="space-y-6">
      <div>
        <h2 id="galeria-title" className="font-display text-xl">
          Galería
        </h2>
        <p className="mt-1 text-sm text-offwhite/55">
          Sube, revisa y elimina material del torneo. La eliminación requiere
          confirmación.
        </p>
      </div>

      <form
        action={subir}
        className="flex flex-col gap-3 border-b border-offwhite/10 pb-6 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label
            htmlFor="galeria-foto"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Fotografía
          </label>
          <input
            ref={inputRef}
            id="galeria-foto"
            type="file"
            name="foto"
            accept="image/jpeg,image/png,image/webp"
            required
            disabled={subiendo}
            className="block w-full text-sm text-offwhite/70 file:mr-3 file:rounded-card file:border-0 file:bg-navy-light file:px-3 file:py-2 file:text-xs file:font-semibold file:text-offwhite"
          />
          <p className="mt-1 text-[11px] text-offwhite/40">
            JPG, PNG o WebP · máximo 10 MB.
          </p>
        </div>
        <button
          type="submit"
          disabled={subiendo}
          className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite disabled:opacity-50"
        >
          {subiendo ? "Subiendo..." : "Subir foto"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}

      {fotos.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {fotos.map((foto) => {
            const eliminando = borrandoId === foto.id;
            return (
              <figure
                key={foto.id}
                className="overflow-hidden rounded-card bg-navy-light"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt="Fotografía del torneo"
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="flex items-center justify-between gap-2 p-2">
                  <span className="text-xs text-offwhite/45">
                    Material del torneo
                  </span>
                  <button
                    type="button"
                    onClick={() => setFotoAEliminar(foto)}
                    disabled={borrandoId !== null}
                    className="text-xs text-coral underline underline-offset-4 disabled:opacity-50"
                  >
                    {eliminando ? "Eliminando..." : "Eliminar"}
                  </button>
                </figcaption>
              </figure>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-offwhite/15 px-5 py-8">
          <p className="text-sm font-medium">Aún no hay fotografías.</p>
          <p className="mt-1 text-sm text-offwhite/50">
            El material subido aparecerá aquí para revisión.
          </p>
        </div>
      )}

      {fotoAEliminar ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/75 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eliminar-foto-title"
        >
          <div className="w-full max-w-md rounded-card bg-navy-light p-5">
            <h2 id="eliminar-foto-title" className="font-display text-xl">
              Eliminar fotografía
            </h2>
            <p className="mt-2 text-sm leading-6 text-offwhite/65">
              Esta acción retirará la fotografía de la galería del torneo.
              ¿Quieres continuar?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFotoAEliminar(null)}
                disabled={Boolean(borrandoId)}
                className="rounded-card border border-offwhite/20 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarBorrado}
                disabled={Boolean(borrandoId)}
                className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite disabled:opacity-50"
              >
                {borrandoId ? "Eliminando..." : "Eliminar fotografía"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
