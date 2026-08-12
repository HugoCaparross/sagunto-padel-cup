// Ruta: src/components/admin/AccesoColaboradorForm.tsx

"use client";

import { useState } from "react";
import { crearAccesoColaborador } from "@/app/(admin)/admin/torneos/[id]/galeria/actions";

interface AccesoColaboradorFormProps {
  torneoId: string;
}

const MIN_DIAS = 1;
const MAX_DIAS = 90;

export default function AccesoColaboradorForm({
  torneoId,
}: AccesoColaboradorFormProps) {
  const [nombre, setNombre] = useState("");
  const [dias, setDias] = useState(14);
  const [url, setUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [copiando, setCopiando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crear() {
    const nombreNormalizado = nombre.trim();

    if (!nombreNormalizado) {
      setError("Introduce el nombre del colaborador.");
      setCopiado(false);
      return;
    }

    if (!Number.isInteger(dias) || dias < MIN_DIAS || dias > MAX_DIAS) {
      setError(`La validez debe estar entre ${MIN_DIAS} y ${MAX_DIAS} días.`);
      setCopiado(false);
      return;
    }

    setEnviando(true);
    setError(null);
    setUrl(null);
    setCopiado(false);

    try {
      const res = await crearAccesoColaborador(
        torneoId,
        nombreNormalizado,
        dias,
      );

      if (!res.ok) {
        setError(
          res.error ?? "No se ha podido generar el acceso para el colaborador.",
        );
        return;
      }

      if (!res.token) {
        setError("El acceso se ha creado, pero no se ha recibido el enlace.");
        return;
      }

      setUrl(`${window.location.origin}/subir/${res.token}`);
      setNombre("");
    } catch (actionError) {
      console.error(
        "[AccesoColaboradorForm] Error creando acceso:",
        actionError,
      );
      setError("Ha ocurrido un error inesperado al generar el acceso.");
    } finally {
      setEnviando(false);
    }
  }

  async function copiarEnlace() {
    if (!url || copiando) {
      return;
    }

    setCopiando(true);
    setError(null);

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch (copyError) {
      console.error(
        "[AccesoColaboradorForm] Error copiando enlace:",
        copyError,
      );
      setError("No se ha podido copiar el enlace. Cópialo manualmente.");
    } finally {
      setCopiando(false);
    }
  }

  return (
    <section
      aria-labelledby="acceso-colaborador-title"
      className="max-w-md space-y-4 rounded-card bg-navy-light p-4"
    >
      <div>
        <h2 id="acceso-colaborador-title" className="text-sm font-semibold">
          Acceso para fotógrafo/videógrafo externo
        </h2>
        <p className="mt-1 text-xs leading-5 text-offwhite/55">
          Genera un enlace temporal limitado al torneo para que un colaborador
          pueda subir material sin acceder al resto de la administración.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <div>
          <label
            htmlFor="nombre-colaborador"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Nombre del colaborador
          </label>
          <input
            id="nombre-colaborador"
            type="text"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            disabled={enviando}
            maxLength={120}
            autoComplete="off"
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none transition focus:border-coral disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="dias-validez"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Validez (días)
          </label>
          <input
            id="dias-validez"
            type="number"
            min={MIN_DIAS}
            max={MAX_DIAS}
            step={1}
            value={dias}
            onChange={(event) => setDias(Number(event.target.value))}
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none transition focus:border-coral disabled:opacity-50"
          />
        </div>
      </div>

      <p className="text-[11px] leading-5 text-offwhite/40">
        El enlace caduca automáticamente y no concede permisos de edición sobre
        resultados, cuadros, horarios ni datos competitivos.
      </p>

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
        {enviando ? "Generando..." : "Generar enlace de subida"}
      </button>

      {url ? (
        <div
          role="status"
          aria-live="polite"
          className="border border-sage/20 bg-sage/5 p-3"
        >
          <p className="text-xs font-semibold text-sage">
            Enlace generado correctamente
          </p>
          <p className="mt-1 break-all text-xs leading-5 text-offwhite/70">
            {url}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copiarEnlace}
              disabled={copiando}
              className="rounded-card border border-offwhite/20 px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              {copiando
                ? "Copiando..."
                : copiado
                  ? "Enlace copiado"
                  : "Copiar enlace"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-offwhite/45">
            Compártelo únicamente con el colaborador asignado al torneo.
          </p>
        </div>
      ) : null}
    </section>
  );
}
