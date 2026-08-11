// Ruta: src/components/admin/PatrocinadoresManager.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearSponsor,
  borrarSponsor,
} from "@/app/(admin)/admin/torneos/[id]/patrocinadores/actions";

type Sponsor = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
};

interface PatrocinadoresManagerProps {
  torneoId: string;
  sponsorsIniciales: Sponsor[];
}

const INITIAL_FORM = {
  nombre: "",
  logo_url: "",
  descripcion: "",
  enlace: "",
  tipo: "comercial" as "comercial" | "institucion",
};

export default function PatrocinadoresManager({
  torneoId,
  sponsorsIniciales,
}: PatrocinadoresManagerProps) {
  const router = useRouter();

  const [sponsors, setSponsors] = useState<Sponsor[]>(sponsorsIniciales);

  const [form, setForm] = useState(INITIAL_FORM);

  const [enviando, setEnviando] = useState(false);

  const [borrandoId, setBorrandoId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function crear() {
    const nombre = form.nombre.trim();

    if (!nombre) {
      setError("El nombre del patrocinador es obligatorio.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const resultado = await crearSponsor(torneoId, {
        ...form,
        nombre,
        logo_url: form.logo_url.trim(),
        descripcion: form.descripcion.trim(),
        enlace: form.enlace.trim(),
      });

      if (!resultado?.ok) {
        setError(resultado?.error ?? "No se ha podido crear el patrocinador.");
        return;
      }

      setForm(INITIAL_FORM);
      router.refresh();
    } catch (actionError) {
      console.error(
        "[PatrocinadoresManager] Error creando patrocinador:",
        actionError,
      );

      setError("Ha ocurrido un error inesperado al crear el patrocinador.");
    } finally {
      setEnviando(false);
    }
  }

  async function borrar(id: string) {
    const sponsor = sponsors.find((item) => item.id === id);

    if (!sponsor) {
      return;
    }

    const confirmado = window.confirm(
      `¿Quieres eliminar el patrocinador "${sponsor.nombre}"?`,
    );

    if (!confirmado) {
      return;
    }

    setBorrandoId(id);
    setError(null);

    try {
      const resultado = await borrarSponsor(torneoId, id);

      if (!resultado?.ok) {
        setError(
          resultado?.error ?? "No se ha podido eliminar el patrocinador.",
        );
        return;
      }

      setSponsors((prev) => prev.filter((item) => item.id !== id));
    } catch (actionError) {
      console.error(
        "[PatrocinadoresManager] Error eliminando patrocinador:",
        actionError,
      );

      setError("Ha ocurrido un error inesperado al eliminar el patrocinador.");
    } finally {
      setBorrandoId(null);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-3 rounded-card bg-navy-light p-4">
        <div>
          <h2 className="text-sm font-semibold">Añadir patrocinador</h2>

          <p className="mt-1 text-xs text-offwhite/50">
            Configura la información que se asociará al torneo.
          </p>
        </div>

        <input
          type="text"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              nombre: event.target.value,
            }))
          }
          disabled={enviando}
          maxLength={160}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
        />

        <input
          type="url"
          placeholder="URL del logo"
          value={form.logo_url}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              logo_url: event.target.value,
            }))
          }
          disabled={enviando}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
        />

        <textarea
          placeholder="Descripción"
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

        <input
          type="url"
          placeholder="Enlace web"
          value={form.enlace}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              enlace: event.target.value,
            }))
          }
          disabled={enviando}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
        />

        <select
          value={form.tipo}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              tipo: event.target.value as "comercial" | "institucion",
            }))
          }
          disabled={enviando}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
        >
          <option value="comercial">Patrocinador comercial</option>

          <option value="institucion">Institución</option>
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
          {enviando ? "Añadiendo..." : "Añadir"}
        </button>
      </div>

      <ul className="space-y-2">
        {sponsors.map((sponsor) => {
          const borrando = borrandoId === sponsor.id;

          return (
            <li
              key={sponsor.id}
              className="flex items-center justify-between gap-3 rounded-card bg-navy-light px-4 py-3"
            >
              <span className="min-w-0 text-sm">
                {sponsor.nombre}{" "}
                <span className="text-xs text-offwhite/50">
                  ({sponsor.tipo})
                </span>
              </span>

              <button
                type="button"
                onClick={() => borrar(sponsor.id)}
                disabled={borrandoId !== null}
                className="shrink-0 text-xs text-coral underline underline-offset-4 disabled:opacity-50"
              >
                {borrando ? "Eliminando..." : "Borrar"}
              </button>
            </li>
          );
        })}
      </ul>

      {!sponsors.length ? (
        <p className="text-sm text-offwhite/50">
          Todavía no hay patrocinadores asociados.
        </p>
      ) : null}
    </div>
  );
}
