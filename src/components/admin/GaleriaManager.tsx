// Ruta: src/components/admin/GaleriaManager.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  subirFoto,
  borrarFoto,
} from "@/app/(admin)/admin/torneos/[id]/galeria/actions";

type Foto = {
  id: string;
  url: string;
};

interface GaleriaManagerProps {
  torneoId: string;
  fotosIniciales: Foto[];
}

export default function GaleriaManager({
  torneoId,
  fotosIniciales,
}: GaleriaManagerProps) {
  const router = useRouter();

  const [fotos, setFotos] = useState<Foto[]>(fotosIniciales);

  const [subiendo, setSubiendo] = useState(false);

  const [borrandoId, setBorrandoId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function subir(formData: FormData) {
    setSubiendo(true);
    setError(null);

    try {
      const res = await subirFoto(torneoId, formData);

      if (!res.ok) {
        setError(res.error ?? "No se ha podido subir la fotografía.");
        return;
      }

      router.refresh();
    } catch (actionError) {
      console.error("[GaleriaManager] Error subiendo fotografía:", actionError);

      setError("Ha ocurrido un error inesperado al subir la fotografía.");
    } finally {
      setSubiendo(false);
    }
  }

  async function borrar(id: string) {
    const foto = fotos.find((item) => item.id === id);

    if (!foto) {
      return;
    }

    const confirmado = window.confirm(
      "¿Quieres eliminar esta fotografía de la galería?",
    );

    if (!confirmado) {
      return;
    }

    setBorrandoId(id);
    setError(null);

    try {
      const res = await borrarFoto(torneoId, id);

      if (!res.ok) {
        setError(res.error ?? "No se ha podido eliminar la fotografía.");
        return;
      }

      setFotos((prev) => prev.filter((item) => item.id !== id));

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
    <div className="space-y-6">
      <form
        action={subir}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="flex-1">
          <label
            htmlFor="galeria-foto"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Fotografía
          </label>

          <input
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
          className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {subiendo ? "Subiendo..." : "Subir foto"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {fotos.map((foto) => {
          const eliminando = borrandoId === foto.id;

          return (
            <div
              key={foto.id}
              className="group relative overflow-hidden rounded-card bg-navy-light"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt=""
                loading="lazy"
                className="aspect-square w-full object-cover"
              />

              <button
                type="button"
                onClick={() => borrar(foto.id)}
                disabled={borrandoId !== null}
                aria-label={`Eliminar fotografía ${foto.id}`}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-navy/90 text-sm text-offwhite transition hover:bg-coral disabled:cursor-not-allowed disabled:opacity-50"
              >
                {eliminando ? "…" : "×"}
              </button>
            </div>
          );
        })}
      </div>

      {!fotos.length ? (
        <p className="text-sm text-offwhite/60">Aún no hay fotos.</p>
      ) : null}
    </div>
  );
}
